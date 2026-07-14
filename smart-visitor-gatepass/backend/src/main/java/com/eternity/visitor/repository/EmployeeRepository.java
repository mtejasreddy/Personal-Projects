package com.eternity.visitor.repository;

import com.eternity.visitor.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByRole(String role);
    Optional<Employee> findByEmail(String email);
}
