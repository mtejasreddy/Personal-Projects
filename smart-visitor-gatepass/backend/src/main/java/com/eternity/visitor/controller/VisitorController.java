package com.eternity.visitor.controller;

import com.eternity.visitor.model.Visitor;
import com.eternity.visitor.service.VisitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow frontend requests from any origin
public class VisitorController {

    private final VisitorService visitorService;

    @PostMapping("/register")
    public ResponseEntity<Visitor> registerVisitor(@RequestBody Visitor visitor) {
        try {
            Visitor registered = visitorService.registerVisitor(visitor);
            return new ResponseEntity<>(registered, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/checkout/{token}")
    public ResponseEntity<?> checkoutVisitor(@PathVariable String token) {
        try {
            Visitor checkedOut = visitorService.checkoutVisitor(token);
            return ResponseEntity.ok(checkedOut);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during checkout.");
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<Visitor>> getActiveVisitors() {
        return ResponseEntity.ok(visitorService.getActiveVisitors());
    }

    @GetMapping("/history")
    public ResponseEntity<List<Visitor>> getVisitorHistory() {
        return ResponseEntity.ok(visitorService.getVisitorHistory());
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> getVisitorByToken(@PathVariable String token) {
        return visitorService.getVisitorByToken(token)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Visitor pass not found."));
    }
}
