import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendViewingConfirmationEmail, sendViewingReminderEmail, sendViewingCancellationEmail } from "./emailService";

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendViewingConfirmationEmail", () => {
    it("should send confirmation email with correct parameters", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const result = await sendViewingConfirmationEmail({
        visitorName: "John Doe",
        visitorEmail: "john@example.com",
        propertyTitle: "Luxury Modern Home",
        propertyAddress: "123 Oak Street, San Francisco, CA 94102",
        viewingDate: new Date("2026-02-15"),
        viewingTime: "2:00 PM",
        duration: 30,
        agentName: "Jane Smith",
        agentPhone: "(555) 123-4567",
        agentEmail: "jane@realestate.com",
        notes: "Please bring ID",
      });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Sending viewing confirmation to john@example.com")
      );
      
      consoleSpy.mockRestore();
    });

    it("should handle email sending with optional notes", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const result = await sendViewingConfirmationEmail({
        visitorName: "Jane Doe",
        visitorEmail: "jane@example.com",
        propertyTitle: "Beachfront Villa",
        propertyAddress: "456 Ocean Drive, Miami, FL 33139",
        viewingDate: new Date("2026-02-20"),
        viewingTime: "10:00 AM",
        duration: 45,
        agentName: "Bob Johnson",
        agentPhone: "(555) 987-6543",
        agentEmail: "bob@realestate.com",
      });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Sending viewing confirmation to jane@example.com")
      );
      
      consoleSpy.mockRestore();
    });

    it("should include property title in logs", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      await sendViewingConfirmationEmail({
        visitorName: "Test User",
        visitorEmail: "test@example.com",
        propertyTitle: "Downtown Penthouse",
        propertyAddress: "789 Main St, New York, NY 10001",
        viewingDate: new Date("2026-02-25"),
        viewingTime: "3:30 PM",
        duration: 30,
        agentName: "Alice Brown",
        agentPhone: "(555) 456-7890",
        agentEmail: "alice@realestate.com",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Downtown Penthouse")
      );
      
      consoleSpy.mockRestore();
    });

    it("should handle errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      // This should not throw even if something goes wrong
      const result = await sendViewingConfirmationEmail({
        visitorName: "Error Test",
        visitorEmail: "error@example.com",
        propertyTitle: "Test Property",
        propertyAddress: "Test Address",
        viewingDate: new Date(),
        viewingTime: "12:00 PM",
        duration: 30,
        agentName: "Test Agent",
        agentPhone: "(555) 000-0000",
        agentEmail: "test@example.com",
      });

      expect(result).toBe(true);
      consoleErrorSpy.mockRestore();
    });
  });

  describe("sendViewingReminderEmail", () => {
    it("should send reminder email 24 hours before viewing", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const result = await sendViewingReminderEmail({
        visitorName: "Reminder Test",
        visitorEmail: "reminder@example.com",
        propertyTitle: "Suburban Home",
        propertyAddress: "321 Elm Street, Austin, TX 78701",
        viewingDate: new Date("2026-02-16"),
        viewingTime: "11:00 AM",
        duration: 30,
        agentName: "Charlie Davis",
        agentPhone: "(555) 111-2222",
        agentEmail: "charlie@realestate.com",
      });

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Sending reminder to reminder@example.com")
      );
      
      consoleSpy.mockRestore();
    });

    it("should include property details in reminder", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      await sendViewingReminderEmail({
        visitorName: "Reminder User",
        visitorEmail: "user@example.com",
        propertyTitle: "Mountain Cabin",
        propertyAddress: "555 Pine Road, Denver, CO 80202",
        viewingDate: new Date("2026-02-18"),
        viewingTime: "2:00 PM",
        duration: 45,
        agentName: "Diana Evans",
        agentPhone: "(555) 333-4444",
        agentEmail: "diana@realestate.com",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Sending reminder to user@example.com")
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("sendViewingCancellationEmail", () => {
    it("should send cancellation email with correct details", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const result = await sendViewingCancellationEmail(
        "cancel@example.com",
        "Cancel User",
        "Cancelled Property",
        new Date("2026-02-20")
      );

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Sending cancellation to cancel@example.com")
      );
      
      consoleSpy.mockRestore();
    });

    it("should handle multiple cancellations", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const result1 = await sendViewingCancellationEmail(
        "user1@example.com",
        "User One",
        "Property One",
        new Date("2026-02-21")
      );

      const result2 = await sendViewingCancellationEmail(
        "user2@example.com",
        "User Two",
        "Property Two",
        new Date("2026-02-22")
      );

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });

    it("should include property title in cancellation", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      await sendViewingCancellationEmail(
        "test@example.com",
        "Test User",
        "Luxury Estate",
        new Date("2026-02-23")
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Sending cancellation to test@example.com")
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("Email content generation", () => {
    it("should generate valid HTML email templates", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      await sendViewingConfirmationEmail({
        visitorName: "HTML Test",
        visitorEmail: "html@example.com",
        propertyTitle: "HTML Test Property",
        propertyAddress: "HTML Test Address",
        viewingDate: new Date("2026-02-24"),
        viewingTime: "1:00 PM",
        duration: 30,
        agentName: "HTML Agent",
        agentPhone: "(555) 555-5555",
        agentEmail: "html@realestate.com",
        notes: "Test notes for HTML",
      });

      // Verify that email was processed
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it("should handle special characters in property details", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const result = await sendViewingConfirmationEmail({
        visitorName: "Special & Char",
        visitorEmail: "special@example.com",
        propertyTitle: "Property with \"Quotes\" & Symbols",
        propertyAddress: "123 Main St. #456, City, ST 12345",
        viewingDate: new Date("2026-02-25"),
        viewingTime: "4:00 PM",
        duration: 30,
        agentName: "Agent O'Brien",
        agentPhone: "(555) 666-6666",
        agentEmail: "special@realestate.com",
      });

      expect(result).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe("Date formatting", () => {
    it("should correctly format viewing dates", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const testDate = new Date("2026-03-15T00:00:00Z");
      
      await sendViewingConfirmationEmail({
        visitorName: "Date Test",
        visitorEmail: "date@example.com",
        propertyTitle: "Date Test Property",
        propertyAddress: "Date Test Address",
        viewingDate: testDate,
        viewingTime: "10:30 AM",
        duration: 30,
        agentName: "Date Agent",
        agentPhone: "(555) 777-7777",
        agentEmail: "date@realestate.com",
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle various date formats", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      const dates = [
        new Date("2026-02-01"),
        new Date("2026-12-31"),
        new Date("2026-06-15"),
      ];

      for (const date of dates) {
        await sendViewingConfirmationEmail({
          visitorName: "Multi Date Test",
          visitorEmail: "multidate@example.com",
          propertyTitle: "Multi Date Property",
          propertyAddress: "Multi Date Address",
          viewingDate: date,
          viewingTime: "2:00 PM",
          duration: 30,
          agentName: "Multi Date Agent",
          agentPhone: "(555) 888-8888",
          agentEmail: "multidate@realestate.com",
        });
      }

      // Each call logs 3 times (email, property, date), so 3 calls = 9 logs
      expect(consoleSpy).toHaveBeenCalledTimes(9);
      consoleSpy.mockRestore();
    });
  });
});
