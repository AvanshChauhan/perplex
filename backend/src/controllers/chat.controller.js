export async function sendMessage(req, res) {
  try {
    // Check if body was parsed at all
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data received. Please ensure you are sending a JSON body and have set the 'Content-Type: application/json' header.",
      });
    }

    const { message } = req.body;
    const user = req.user;

    // Check if the specific 'message' field is present
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "The 'message' field is required in the request body.",
      });
    }

    console.log(`Message from ${user.username}: ${message}`);

    return res.status(200).json({
      success: true,
      message: "Message received successfully",
      received: message
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
