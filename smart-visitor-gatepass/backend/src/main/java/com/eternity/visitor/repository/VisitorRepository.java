package com.eternity.visitor.repository;

import com.eternity.visitor.model.Visitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorRepository extends JpaRepository<Visitor, Long> {
    
    Optional<Visitor> findByToken(String token);
    
    List<Visitor> findByStatusOrderByCheckInTimeDesc(String status);
    
    List<Visitor> findAllByOrderByCheckInTimeDesc();
}
