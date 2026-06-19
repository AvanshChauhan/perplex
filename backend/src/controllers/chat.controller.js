import mongoose from "mongoose";
import { generateResponse, generateChatTitle } from "../services/ai.servise.js";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";

/*
  sendMessage handles the complete chat-message request flow.

  Expected request body:
  {
    "message": "User question here",
    "chat": "optional existing chat id"
  }

  High-level working:
  1. Validate that the request has a JSON body.
  2. Validate that the user sent a message.
  3. If no chat id is provided, create a new chat with an AI-generated title.
  4. If a chat id is provided, find that chat and make sure it belongs to the
     logged-in user.
  5. Send the user message to the AI service.
  6. Store both messages in MongoDB:
     - the user's original message with role "user"
     - the AI response with role "ai"
  7. Return the response, chat details, and saved message documents.
*/
export async function sendMessage(req, res) {
  try {
    // Express stores parsed JSON data in req.body.
    // If req.body is missing or empty, the frontend probably did not send JSON
    // correctly or forgot the "Content-Type: application/json" header.
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No data received. Please ensure you are sending a JSON body and have set the 'Content-Type: application/json' header.",
      });
    }

    // "message" is the text written by the user.
    // "chatId" is optional. If it exists, this message belongs to an old chat.
    // If it does not exist, we create a new chat first.
    const { message, chat: chatId } = req.body;

    // The authentication middleware adds the logged-in user to req.user.
    // This controller depends on that middleware running before sendMessage.
    const user = req.user;

    // The AI cannot generate a useful answer without user text, so stop early
    // when the "message" field is missing, empty, null, or undefined.
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "The 'message' field is required in the request body.",
      });
    }

    // These are filled depending on whether this is a new chat or an existing
    // chat. "title" stays null for existing chats because their title already
    // exists in the database.
    let title = null;
    let chat = null;

    if (!chatId) {
      // New conversation:
      // Ask the AI service to create a short title from the first user message.
      title = await generateChatTitle(message);

      // Create the chat document and connect it to the logged-in user.
      // The returned "chat" document gives us chat._id for saving messages.
      chat = await Chat.create({
        user: user._id,
        title,
      });
    } else {
      // Existing conversation:
      // Before querying MongoDB, verify that the id has a valid ObjectId shape.
      // Without this, Mongoose can throw a CastError for invalid ids.
      if (!mongoose.isValidObjectId(chatId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat id.",
        });
      }

      // Find the chat only if it belongs to the logged-in user.
      // This prevents one user from sending messages into another user's chat
      // by guessing or copying a chat id.
      chat = await Chat.findOne({ _id: chatId, user: user._id });

      // If no matching chat exists, either the id is wrong or the chat belongs
      // to a different user.
      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found.",
        });
      }
    }

    // Load old messages from this chat, then append the new user message.
    // This gives the AI context from the conversation instead of only the
    // latest message.
    const previousMessages = await Message.find({ chat: chat._id })
      .sort({ _id: 1 })
      .select("role content");

    const messagesForAi = [
      ...previousMessages,
      {
        role: "user",
        content: message,
      },
    ];

    // Send the complete message array to the AI service.
    // generateResponse returns plain text from the model.
    const result = await generateResponse(messagesForAi);

    // Save the user's original text in the Message collection.
    // This is important because chat history should contain exactly what the
    // user typed, not the AI-generated result.
    const humanMessage = await Message.create({
      chat: chat._id,
      content: message,
      role: "user",
    });

    // Save the AI answer in the same chat with role "ai".
    // Together, humanMessage and aiMessage form one complete chat turn.
    const aiMessage = await Message.create({
      chat: chat._id,
      content: result,
      role: "ai",
    });

    // Send useful data back to the frontend so it can display the answer,
    // update the chat list, and append both saved messages to the UI.
    res.json({
      response: result,
      title,
      chat,
      humanMessage,
      aiMessage,
    });
  } catch (error) {
    // Any unexpected database, AI-service, or runtime error is handled here.
    // The error message is returned for easier debugging during development.
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

export async function getMessages(req, res) {
  try {
    const { chatId } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(chatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat id.",
      });
    }

    const chat = await Chat.findOne({ _id: chatId, user: user._id });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found.",
      });
    }

    const messages = await Message.find({ chat: chat._id }).sort({ _id: 1 });

    return res.status(200).json({
      success: true,
      chat,
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

export async function getMessage(req, res) {
  try {
    const { messageId } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message id.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    const chat = await Chat.findOne({ _id: message.chat, user: user._id });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

export async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const user = req.user;

    if (!mongoose.isValidObjectId(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message id.",
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    const chat = await Chat.findOne({ _id: message.chat, user: user._id });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    await Message.deleteOne({ _id: message._id });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
      deletedMessage: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
