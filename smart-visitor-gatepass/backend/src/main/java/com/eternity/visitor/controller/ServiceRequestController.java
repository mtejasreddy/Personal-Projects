package com.eternity.visitor.controller;

import com.eternity.visitor.model.ServiceRequest;
import com.eternity.visitor.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceRequestController {

    private final ServiceRequestRepository serviceRequestRepository;

    @GetMapping
    public ResponseEntity<List<ServiceRequest>> getAllServices() {
        return ResponseEntity.ok(serviceRequestRepository.findAllByOrderByRequestDateDesc());
    }

    @PostMapping
    public ResponseEntity<ServiceRequest> createService(@RequestBody ServiceRequest serviceRequest) {
        if (serviceRequest.getRequestDate() == null) {
            serviceRequest.setRequestDate(LocalDate.now());
        }
        ServiceRequest saved = serviceRequestRepository.save(serviceRequest);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Optional<ServiceRequest> optionalRequest = serviceRequestRepository.findById(id);
        if (optionalRequest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ServiceRequest request = optionalRequest.get();
        if (payload.containsKey("status")) {
            request.setStatus(payload.get("status"));
        }
        if (payload.containsKey("assignedEngineer")) {
            request.setAssignedEngineer(payload.get("assignedEngineer"));
        }
        
        ServiceRequest updated = serviceRequestRepository.save(request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        if (serviceRequestRepository.existsById(id)) {
            serviceRequestRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
