package com.eternity.visitor.repository;

import com.eternity.visitor.model.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    long countByStatus(String status);
    List<ServiceRequest> findByStatus(String status);
    List<ServiceRequest> findAllByOrderByRequestDateDesc();
}
