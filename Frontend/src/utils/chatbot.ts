// Simple AI chatbot logic for property owner responses
export function generateOwnerResponse(userMessage: string, propertyData?: any): string {
  const message = userMessage.toLowerCase().trim();

  // Greetings
  if (message.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
    const greetings = ['Hello! Thank you for your interest in my property. How can I help you today?', "Hi there! I'm happy to answer any questions about the property.", 'Hello! Feel free to ask me anything about the apartment.', 'Hey! Thanks for reaching out. What would you like to know?'];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Availability questions
  if (message.match(/available|vacancy|vacant|free|when can i move/)) {
    return 'Yes, the property is currently available! You can move in immediately after completing the paperwork and deposit. Would you like to schedule a visit?';
  }

  // Rent/Price questions
  if (message.match(/rent|price|cost|how much|monthly|payment/)) {
    return 'The monthly rent is NPR 25,000 with a security deposit of NPR 50,000 (2 months rent). This includes basic maintenance. Utilities are separate. Would you like more details about the payment terms?';
  }

  // Visit/viewing questions
  if (message.match(/visit|see|view|tour|inspection|look at|check out/)) {
    return "I'd be happy to arrange a property viewing! I'm available most days between 10 AM - 6 PM. What day works best for you? We can schedule a 30-minute tour.";
  }

  // Amenities/facilities questions
  if (message.match(/amenities|facilities|features|include|wifi|parking|water|electricity/)) {
    return 'The property includes parking space, 24/7 water supply, and backup power. WiFi is not included but can be easily installed. The building has security and regular maintenance. What specific amenities are you interested in?';
  }

  // Furnishing questions
  if (message.match(/furnish|furniture|equipped|appliances/)) {
    return "The apartment is semi-furnished with basic fixtures. It includes kitchen cabinets, bathroom fittings, and wardrobes. You'll need to bring your own bed, sofa, and appliances. Would you like to see photos of the current condition?";
  }

  // Location/area questions
  if (message.match(/location|area|nearby|close to|distance|transport|bus|market|school|hospital/)) {
    return "The property is in Biratnagar, Shanti Chowk area. It's very well-connected - 5 minutes walk to the main market, close to schools and hospitals. Public transport is easily accessible. The neighborhood is safe and quiet. What specific locations are you interested in?";
  }

  // Pets questions
  if (message.match(/pet|dog|cat|animal/)) {
    return 'Small pets are allowed with prior approval and an additional deposit. Please let me know what type of pet you have, and we can discuss the terms.';
  }

  // Contract/agreement questions
  if (message.match(/contract|agreement|lease|duration|how long|minimum stay/)) {
    return 'The minimum lease period is 6 months, with an option to renew. The contract is standard and includes all terms clearly. I can send you a sample agreement to review. Are you looking for short-term or long-term rental?';
  }

  // Deposit/advance questions
  if (message.match(/deposit|advance|security|refund/)) {
    return "The security deposit is NPR 50,000 (2 months rent), which is fully refundable when you move out, provided there's no damage. First month's rent is due at signing. The deposit will be returned within 15 days after you vacate.";
  }

  // Roommate/sharing questions
  if (message.match(/roommate|share|sharing|flatmate|together/)) {
    return "This property is suitable for families or working professionals. If you're planning to share with roommates, please let me know how many people will be staying so we can discuss if it's appropriate for the space.";
  }

  // Maintenance questions
  if (message.match(/maintenance|repair|fix|problem|issue/)) {
    return "I'm very responsive to maintenance requests. For urgent issues, I'm available 24/7. Regular maintenance is included in the rent. I ensure all repairs are done promptly to keep the property in excellent condition.";
  }

  // Negotiation
  if (message.match(/negotiate|lower|reduce|discount|cheaper|bargain/)) {
    return 'The rent is fairly priced for the area and amenities provided. However, for long-term leases (1 year+), we can discuss a small discount. What lease duration are you considering?';
  }

  // Thank you
  if (message.match(/thank|thanks|appreciate/)) {
    return "You're welcome! Feel free to ask if you have any other questions. I'm here to help make your decision easier.";
  }

  // Goodbye
  if (message.match(/bye|goodbye|see you|talk later/)) {
    return 'Thank you for your interest! Feel free to reach out anytime. Have a great day!';
  }

  // Default response for unmatched queries
  const defaultResponses = ["That's a great question! Could you provide a bit more detail so I can give you the best answer?", "I'd be happy to help with that. Can you tell me more about what you're looking for?", 'Let me help you with that. What specific information would be most useful for you?', "I'm here to answer all your questions. Could you elaborate a bit more on what you'd like to know?"];
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Simulate typing delay for more natural conversation
export function simulateTypingDelay(messageLength: number): number {
  // Base delay + variable delay based on message length
  const baseDelay = 1000; // 1 second
  const charDelay = 30; // 30ms per character
  return baseDelay + messageLength * charDelay;
}