package com.eternity.visitor.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "service_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String ticketId; // e.g. "SR-001"

    @Column(nullable = false)
    private String customerName;

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(nullable = false, length = 1000)
    private String problemDescription;

    @Column(nullable = false)
    private String priority; // "Low", "Medium", "High", "Critical"

    @Column(nullable = false)
    private String assignedEngineer; // Employee Name (Engineer)

    @Column(nullable = false)
    private LocalDate requestDate;

    @Column(nullable = false)
    private String status; // "Pending", "Assigned", "In Progress", "Completed"
}
