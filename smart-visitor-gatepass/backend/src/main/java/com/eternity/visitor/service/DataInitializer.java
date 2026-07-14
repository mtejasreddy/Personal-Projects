package com.eternity.visitor.service;

import com.eternity.visitor.model.Device;
import com.eternity.visitor.model.Employee;
import com.eternity.visitor.model.ServiceRequest;
import com.eternity.visitor.repository.DeviceRepository;
import com.eternity.visitor.repository.EmployeeRepository;
import com.eternity.visitor.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final EmployeeRepository employeeRepository;
    private final DeviceRepository deviceRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    @Override
    public void run(String... args) throws Exception {
        seedEmployees();
        seedDevicesAndServices();
    }

    private void seedEmployees() {
        if (employeeRepository.count() == 0) {
            log.info("Seeding mock employee data...");
            List<Employee> employees = Arrays.asList(
                    Employee.builder().name("Rajesh Kumar").email("rajesh.k@eternity.com").phone("+91 9876543211").department("IT Support").role("Engineer").build(),
                    Employee.builder().name("Sarah D'Souza").email("sarah.d@eternity.com").phone("+91 9876543212").department("Operations").role("Manager").build(),
                    Employee.builder().name("Amit Patel").email("amit.p@eternity.com").phone("+91 9876543213").department("Maintenance").role("Engineer").build(),
                    Employee.builder().name("Preeti Sharma").email("preeti.s@eternity.com").phone("+91 9876543214").department("Security").role("Security Guard").build(),
                    Employee.builder().name("John Doe").email("john.doe@eternity.com").phone("+91 9876543215").department("Reception").role("Receptionist").build()
            );
            employeeRepository.saveAll(employees);
            log.info("Successfully seeded {} employees.", employees.size());
        }
    }

    private void seedDevicesAndServices() {
        if (deviceRepository.count() == 0) {
            log.info("Seeding mock devices and service requests...");

            Device dev1 = Device.builder()
                    .customerName("Eternity Admin")
                    .companyName("Eternity Infotech Block A")
                    .deviceType("Biometric Scanner")
                    .deviceBrand("Anviz")
                    .modelNumber("M5 Pro")
                    .serialNumber("BIO-100234")
                    .installationDate(LocalDate.now().minusDays(30))
                    .warrantyExpiry(LocalDate.now().plusYears(1))
                    .installationLocation("Server Room Entrance")
                    .engineerAssigned("Rajesh Kumar")
                    .status("Active")
                    .build();

            Device dev2 = Device.builder()
                    .customerName("Vikas Mehra")
                    .companyName("Techno Park Systems")
                    .deviceType("CCTV Camera")
                    .deviceBrand("Hikvision")
                    .modelNumber("DS-2CD2143G0-I")
                    .serialNumber("CAM-789012")
                    .installationDate(LocalDate.now().minusDays(90))
                    .warrantyExpiry(LocalDate.now().plusMonths(9))
                    .installationLocation("Parking Lot Main Gate")
                    .engineerAssigned("Amit Patel")
                    .status("Active")
                    .build();

            Device dev3 = Device.builder()
                    .customerName("Anjali Sen")
                    .companyName("Apex Co-Working")
                    .deviceType("Smart Lock")
                    .deviceBrand("Yale")
                    .modelNumber("YDM-3109")
                    .serialNumber("LCK-554433")
                    .installationDate(LocalDate.now().minusDays(5))
                    .warrantyExpiry(LocalDate.now().plusYears(2))
                    .installationLocation("Conference Room B")
                    .engineerAssigned("Rajesh Kumar")
                    .status("Installed")
                    .build();

            Device dev4 = Device.builder()
                    .customerName("Karan Johar")
                    .companyName("KJ Studios")
                    .deviceType("Fire Alarm")
                    .deviceBrand("Honeywell")
                    .modelNumber("Notifier NFS2-640")
                    .serialNumber("ALM-332211")
                    .installationDate(LocalDate.now().minusDays(120))
                    .warrantyExpiry(LocalDate.now().plusMonths(8))
                    .installationLocation("Studio 1 Entrance")
                    .engineerAssigned("Amit Patel")
                    .status("Under Maintenance")
                    .build();

            deviceRepository.saveAll(Arrays.asList(dev1, dev2, dev3, dev4));

            // Seed Service Requests
            ServiceRequest sr1 = ServiceRequest.builder()
                    .ticketId("SR-001")
                    .customerName("Karan Johar")
                    .device(dev4)
                    .problemDescription("Intermittent beep sounds and false trigger warnings on block B controller board.")
                    .priority("High")
                    .assignedEngineer("Amit Patel")
                    .requestDate(LocalDate.now().minusDays(2))
                    .status("In Progress")
                    .build();

            ServiceRequest sr2 = ServiceRequest.builder()
                    .ticketId("SR-002")
                    .customerName("Vikas Mehra")
                    .device(dev2)
                    .problemDescription("Night vision infrared LEDs not turning on during low light conditions.")
                    .priority("Medium")
                    .assignedEngineer("Amit Patel")
                    .requestDate(LocalDate.now().minusDays(10))
                    .status("Completed")
                    .build();

            ServiceRequest sr3 = ServiceRequest.builder()
                    .ticketId("SR-003")
                    .customerName("Eternity Admin")
                    .device(dev1)
                    .problemDescription("User fingerprints failing to authenticate after security patch update.")
                    .priority("Critical")
                    .assignedEngineer("Rajesh Kumar")
                    .requestDate(LocalDate.now().minusDays(1))
                    .status("Pending")
                    .build();

            serviceRequestRepository.saveAll(Arrays.asList(sr1, sr2, sr3));
            log.info("Successfully seeded devices and service requests.");
        }
    }
}
