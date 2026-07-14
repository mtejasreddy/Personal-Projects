package com.eternity.visitor.controller;

import com.eternity.visitor.model.Visitor;
import com.eternity.visitor.repository.DeviceRepository;
import com.eternity.visitor.repository.ServiceRequestRepository;
import com.eternity.visitor.repository.VisitorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final VisitorRepository visitorRepository;
    private final DeviceRepository deviceRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        // Visitor Stats
        List<Visitor> allVisitors = visitorRepository.findAll();
        long visitorsToday = allVisitors.stream()
                .filter(v -> v.getCheckInTime() != null && v.getCheckInTime().toLocalDate().isEqual(LocalDate.now()))
                .count();
        long currentlyInside = allVisitors.stream()
                .filter(v -> "CHECKED_IN".equals(v.getStatus()))
                .count();
        long safelyCheckedOut = allVisitors.stream()
                .filter(v -> "CHECKED_OUT".equals(v.getStatus()))
                .count();

        stats.put("visitorsToday", visitorsToday);
        stats.put("currentlyInside", currentlyInside);
        stats.put("safelyCheckedOut", safelyCheckedOut);

        // Device Stats
        long devicesInstalled = deviceRepository.count();
        long activeDevices = deviceRepository.findAll().stream()
                .filter(d -> "Active".equalsIgnoreCase(d.getStatus()) || "Installed".equalsIgnoreCase(d.getStatus()))
                .count();
        long underMaintenanceDevices = deviceRepository.findAll().stream()
                .filter(d -> "Under Maintenance".equalsIgnoreCase(d.getStatus()))
                .count();

        stats.put("devicesInstalled", devicesInstalled);
        stats.put("activeDevices", activeDevices);
        stats.put("underMaintenanceDevices", underMaintenanceDevices);

        // Service Request Stats
        long pendingServices = serviceRequestRepository.countByStatus("Pending") +
                serviceRequestRepository.countByStatus("Assigned") +
                serviceRequestRepository.countByStatus("In Progress");
        long completedServices = serviceRequestRepository.countByStatus("Completed");

        stats.put("pendingServices", pendingServices);
        stats.put("completedServices", completedServices);

        return ResponseEntity.ok(stats);
    }
}
