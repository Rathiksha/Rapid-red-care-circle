/**
 * Blood request management service
 */

class RequestService {
  constructor() {
    this.requests = [];
  }

  /**
   * Creates a blood request with color band classification
   */
  createRequest(requestData) {
    const { bloodGroup, location, requiredTimeframe, requesterId } = requestData;

    // Determine color band based on timeframe
    let urgencyBand;
    if (requiredTimeframe === 'immediate') {
      urgencyBand = 'RED';
    } else if (requiredTimeframe === 'within_24_hours') {
      urgencyBand = 'PINK';
    } else {
      urgencyBand = 'WHITE';
    }

    const request = {
      id: Date.now(),
      bloodGroup,
      location,
      urgencyBand,
      requesterId,
      status: 'PENDING',
      createdAt: new Date(),
      viewedAt: null
    };

    this.requests.push(request);
    return request;
  }

  /**
   * Checks if a Red Band request has expired (20 minutes after viewing or creation)
   */
  checkRedBandExpiration(request) {
    if (request.urgencyBand !== 'RED') {
      return false;
    }

    const now = new Date();
    const referenceTime = request.viewedAt || request.createdAt;
    const minutesElapsed = (now - referenceTime) / (1000 * 60);

    // Red Band expires after 20 minutes if viewed, or 10 minutes if not viewed
    const expirationThreshold = request.viewedAt ? 20 : 10;

    if (minutesElapsed > expirationThreshold) {
      request.status = 'EXPIRED';
      this.triggerNotification(request, 'Request expired - donor not available');
      return true;
    }

    return false;
  }

  /**
   * Triggers notification (placeholder)
   */
  triggerNotification(request, message) {
    // In real implementation, this would send push notification
    console.log(`Notification for request ${request.id}: ${message}`);
    return { requestId: request.id, message, sent: true };
  }

  /**
   * Gets a request by ID
   */
  getRequest(id) {
    return this.requests.find(r => r.id === id);
  }
}

module.exports = new RequestService();
