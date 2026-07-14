package com.eternity.visitor.service;

import com.eternity.visitor.model.Visitor;
import com.eternity.visitor.repository.VisitorRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisitorService {

    private final VisitorRepository visitorRepository;
    private final JavaMailSender mailSender;

    public Visitor registerVisitor(Visitor visitor) {
        // Generate a secure, unique token for QR code matching
        visitor.setToken(UUID.randomUUID().toString());
        visitor.setStatus("CHECKED_IN");
        visitor.setCheckInTime(LocalDateTime.now());
        
        Visitor savedVisitor = visitorRepository.save(visitor);
        
        // Send email notifications asynchronously (or synchronously for this demo, wrapped in try-catch so it won't crash if mail fails)
        try {
            sendEmployeeNotification(savedVisitor);
            sendVisitorGatePassEmail(savedVisitor);
        } catch (Exception e) {
            log.error("Failed to send notification emails for visitor: {}", savedVisitor.getName(), e);
        }
        
        return savedVisitor;
    }

    public Visitor checkoutVisitor(String token) {
        Optional<Visitor> optionalVisitor = visitorRepository.findByToken(token);
        if (optionalVisitor.isEmpty()) {
            throw new IllegalArgumentException("Invalid gate pass token.");
        }
        
        Visitor visitor = optionalVisitor.get();
        if ("CHECKED_OUT".equals(visitor.getStatus())) {
            throw new IllegalStateException("Visitor is already checked out.");
        }
        
        visitor.setStatus("CHECKED_OUT");
        visitor.setCheckOutTime(LocalDateTime.now());
        
        return visitorRepository.save(visitor);
    }

    public List<Visitor> getActiveVisitors() {
        return visitorRepository.findByStatusOrderByCheckInTimeDesc("CHECKED_IN");
    }

    public List<Visitor> getVisitorHistory() {
        return visitorRepository.findAllByOrderByCheckInTimeDesc();
    }

    public Optional<Visitor> getVisitorByToken(String token) {
        return visitorRepository.findByToken(token);
    }

    private void sendEmployeeNotification(Visitor visitor) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setTo(visitor.getEmployeeEmail());
        helper.setSubject("Visitor Notification: " + visitor.getName() + " has arrived at Eternity Infotech");
        
        String checkInTimeStr = visitor.getCheckInTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        
        String htmlContent = "<html><body style='font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;'>"
                + "<div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;'>"
                + "  <div style='background-color: #0f172a; padding: 20px; text-align: center; color: #38bdf8; font-weight: bold; font-size: 20px; letter-spacing: 1px;'>"
                + "    ETERNITY INFOTECH - VISITOR MANAGEMENT"
                + "  </div>"
                + "  <div style='padding: 30px; color: #334155; line-height: 1.6;'>"
                + "    <h2 style='color: #0f172a; margin-top: 0;'>Hello " + visitor.getEmployeeName() + ",</h2>"
                + "    <p>A visitor has arrived at the reception checkpoint to meet with you.</p>"
                + "    <table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>"
                + "      <tr><td style='padding: 8px 0; font-weight: bold; width: 150px; border-bottom: 1px solid #f1f5f9;'>Visitor Name:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0284c7; font-weight: bold;'>" + visitor.getName() + "</td></tr>"
                + "      <tr><td style='padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;'>Phone Number:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9;'>" + visitor.getPhone() + "</td></tr>"
                + "      <tr><td style='padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;'>Email Address:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9;'>" + visitor.getEmail() + "</td></tr>"
                + "      <tr><td style='padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;'>Purpose of Visit:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-style: italic;'>" + visitor.getPurpose() + "</td></tr>"
                + "      <tr><td style='padding: 8px 0; font-weight: bold; border-bottom: 1px solid #f1f5f9;'>Check-in Time:</td><td style='padding: 8px 0; border-bottom: 1px solid #f1f5f9;'>" + checkInTimeStr + "</td></tr>"
                + "    </table>"
                + "    <p style='background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; color: #166534; font-size: 14px; border-radius: 4px;'>"
                + "      <strong>Status:</strong> Currently Checked In. They have been issued a temporary digital Gate Pass."
                + "    </p>"
                + "  </div>"
                + "  <div style='background-color: #f8fafc; text-align: center; padding: 15px; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;'>"
                + "    This is an automated notification from Eternity Infotech Visitor Gate Pass System."
                + "  </div>"
                + "</div>"
                + "</body></html>";
                
        helper.setText(htmlContent, true);
        mailSender.send(message);
        log.info("Notification email sent to employee: {}", visitor.getEmployeeEmail());
    }

    private void sendVisitorGatePassEmail(Visitor visitor) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setTo(visitor.getEmail());
        helper.setSubject("Eternity Infotech: Your Digital Gate Pass");
        
        String checkInTimeStr = visitor.getCheckInTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        String passUrl = "http://localhost:5173/pass/" + visitor.getToken();
        
        String htmlContent = "<html><body style='font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;'>"
                + "<div style='max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0;'>"
                + "  <div style='background-color: #0f172a; padding: 25px; text-align: center; color: #ffffff;'>"
                + "    <h2 style='margin: 0; font-size: 20px; letter-spacing: 1px; color: #38bdf8;'>ETERNITY INFOTECH</h2>"
                + "    <div style='background-color: #1e293b; color: #22c55e; display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-top: 10px; border: 1px solid #14532d;'>"
                + "      DIGITAL GATE PASS"
                + "    </div>"
                + "  </div>"
                + "  <div style='padding: 30px; text-align: center; color: #334155;'>"
                + "    <p style='font-size: 16px; margin-top: 0;'>Welcome, <strong>" + visitor.getName() + "</strong>!</p>"
                + "    <p style='color: #64748b; font-size: 14px;'>You have been registered for a visit to meet <strong>" + visitor.getEmployeeName() + "</strong>.</p>"
                + "    "
                + "    <div style='background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0;'>"
                + "      <div style='font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: bold;'>Gate Pass Code</div>"
                + "      <div style='font-size: 18px; color: #0f172a; font-weight: bold; font-family: monospace; margin: 5px 0;'>" + visitor.getToken() + "</div>"
                + "      <div style='font-size: 11px; color: #94a3b8; margin-top: 5px;'>Please present this pass at the gate when leaving.</div>"
                + "    </div>"
                + "    "
                + "    <a href='" + passUrl + "' style='display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.2); transition: background-color 0.2s;'>"
                + "      View & Download Gate Pass QR Code"
                + "    </a>"
                + "    <br/><br/>"
                + "    <span style='font-size: 12px; color: #94a3b8;'>Registered at: " + checkInTimeStr + "</span>"
                + "  </div>"
                + "  <div style='background-color: #f1f5f9; text-align: center; padding: 15px; color: #64748b; font-size: 11px; border-top: 1px solid #e2e8f0;'>"
                + "    Eternity Infotech Pvt. Ltd. | Secure Checkpoint"
                + "  </div>"
                + "</div>"
                + "</body></html>";
                
        helper.setText(htmlContent, true);
        mailSender.send(message);
        log.info("Gate Pass email sent to visitor: {}", visitor.getEmail());
    }
}
