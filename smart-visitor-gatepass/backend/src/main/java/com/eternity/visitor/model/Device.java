package com.eternity.visitor.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "devices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String deviceType; // e.g. "CCTV Camera", "Biometric Scanner", "Fire Alarm", "Smart Lock"

    @Column(nullable = false)
    private String deviceBrand; // e.g. "Hikvision", "Honeywell", "Bosch"

    @Column(nullable = false)
    private String modelNumber;

    @Column(nullable = false, unique = true)
    private String serialNumber;

    @Column(nullable = false)
    private LocalDate installationDate;

    @Column(nullable = false)
    private LocalDate warrantyExpiry;

    @Column(nullable = false)
    private String installationLocation; // e.g. "Main Gate", "Server Room", "Block A Reception"

    @Column(nullable = false)
    private String engineerAssigned; // Employee Name (Engineer)

    @Column(nullable = false)
    private String status; // "Installed", "Active", "Under Maintenance", "Replaced"
}
