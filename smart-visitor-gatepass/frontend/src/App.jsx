import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  UserPlus, 
  ScanLine, 
  History, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Clock, 
  ArrowRight, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  RefreshCw, 
  Eye, 
  LogOut,
  ChevronRight,
  Sparkles,
  Camera,
  LayoutDashboard,
  Wrench,
  Monitor,
  BarChart3,
  Settings,
  Trash2,
  Plus,
  Search,
  Building,
  UserCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const API_BASE_URL = 'http://localhost:8080/api/visitors';
const API_DEVICES_URL = 'http://localhost:8080/api/devices';
const API_SERVICES_URL = 'http://localhost:8080/api/services';
const API_EMPLOYEES_URL = 'http://localhost:8080/api/employees';
const API_STATS_URL = 'http://localhost:8080/api/dashboard/stats';

function App() {
  // Navigation / Routing
  const [currentRoute, setCurrentRoute] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/pass/')) {
      const token = path.split('/')[2];
      return { name: 'pass', token };
    }
    if (path === '/scan') return { name: 'gatepass' };
    if (path === '/visitors') return { name: 'visitors' };
    if (path === '/employees') return { name: 'employees' };
    if (path === '/devices') return { name: 'devices' };
    if (path === '/services') return { name: 'services' };
    if (path === '/reports') return { name: 'reports' };
    if (path === '/settings') return { name: 'settings' };
    return { name: 'dashboard' };
  });

  // State Management
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [historyVisitors, setHistoryVisitors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [devices, setDevices] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    visitorsToday: 0,
    currentlyInside: 0,
    safelyCheckedOut: 0,
    devicesInstalled: 0,
    activeDevices: 0,
    underMaintenanceDevices: 0,
    pendingServices: 0,
    completedServices: 0
  });

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '', // links to selected employee
    purpose: 'Business Meeting'
  });

  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'IT Support',
    role: 'Engineer'
  });

  const [deviceFormData, setDeviceFormData] = useState({
    customerName: '',
    companyName: '',
    deviceType: 'Biometric Scanner',
    deviceBrand: 'Anviz',
    modelNumber: '',
    serialNumber: '',
    installationLocation: '',
    engineerAssigned: '',
    status: 'Installed',
    installationDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
  });

  const [serviceFormData, setServiceFormData] = useState({
    deviceId: '',
    problemDescription: '',
    priority: 'Medium',
    assignedEngineer: '',
    status: 'Pending'
  });

  // Selection states
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [passVisitor, setPassVisitor] = useState(null);
  const [passError, setPassError] = useState(null);

  // Scanner State
  const [scanResult, setScanResult] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  // Reports state
  const [activeReportTab, setActiveReportTab] = useState('installations');

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync route on popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/pass/')) {
        const token = path.split('/')[2];
        setCurrentRoute({ name: 'pass', token });
      } else if (path === '/scan') {
        setCurrentRoute({ name: 'gatepass' });
      } else if (path === '/visitors') {
        setCurrentRoute({ name: 'visitors' });
      } else if (path === '/employees') {
        setCurrentRoute({ name: 'employees' });
      } else if (path === '/devices') {
        setCurrentRoute({ name: 'devices' });
      } else if (path === '/services') {
        setCurrentRoute({ name: 'services' });
      } else if (path === '/reports') {
        setCurrentRoute({ name: 'reports' });
      } else if (path === '/settings') {
        setCurrentRoute({ name: 'settings' });
      } else {
        setCurrentRoute({ name: 'dashboard' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper to change URL and route state
  const navigateTo = (routeName, path, extraParams = {}) => {
    window.history.pushState(null, '', path);
    if (routeName === 'pass') {
      setCurrentRoute({ name: 'pass', token: extraParams.token });
    } else {
      setCurrentRoute({ name: routeName });
    }
  };

  // Fetch Dashboard Stats and core collections
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(API_STATS_URL);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Visitors
      const activeRes = await fetch(`${API_BASE_URL}/active`);
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveVisitors(activeData);
      }

      const historyRes = await fetch(`${API_BASE_URL}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistoryVisitors(historyData);
      }

      // 3. Fetch Employees
      const empRes = await fetch(API_EMPLOYEES_URL);
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }

      // 4. Fetch Devices
      const devRes = await fetch(API_DEVICES_URL);
      if (devRes.ok) {
        const devData = await devRes.json();
        setDevices(devData);
      }

      // 5. Fetch Services
      const servRes = await fetch(API_SERVICES_URL);
      if (servRes.ok) {
        const servData = await servRes.json();
        setServices(servData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error syncing with server. Make sure Spring Boot backend is active.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentRoute.name]);

  // Load standalone pass data
  useEffect(() => {
    if (currentRoute.name === 'pass' && currentRoute.token) {
      setLoading(true);
      fetch(`${API_BASE_URL}/${currentRoute.token}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then(data => {
          setPassVisitor(data);
          setPassError(null);
        })
        .catch(err => {
          setPassError(err.message || 'Pass not found.');
          showToast('Failed to load gate pass details', 'error');
        })
        .finally(() => setLoading(false));
    }
  }, [currentRoute.name, currentRoute.token]);

  // Handle visitor registration
  const handleRegisterVisitor = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Find selected host employee details
      const selectedHost = employees.find(emp => emp.id === parseInt(formData.employeeId));
      if (!selectedHost) {
        showToast('Please select a valid employee host.', 'error');
        setLoading(false);
        return;
      }

      const visitorPayload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        employeeName: selectedHost.name,
        employeeEmail: selectedHost.email,
        purpose: formData.purpose
      };

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorPayload)
      });
      
      if (!response.ok) throw new Error('Registration failed.');
      
      const newVisitor = await response.json();
      showToast('Visitor registered and Gate Pass generated!', 'success');
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        employeeId: '',
        purpose: 'Business Meeting'
      });
      
      setSelectedVisitor(newVisitor);
      fetchData();
    } catch (error) {
      showToast(error.message || 'Error registering visitor', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Checkout
  const handleCheckout = async (token) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/checkout/${token}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Checkout failed.');
      
      showToast(`${data.name} has checked out successfully.`, 'success');
      fetchData();
      if (selectedVisitor && selectedVisitor.token === token) {
        setSelectedVisitor(data);
      }
    } catch (error) {
      showToast(error.message || 'Checkout failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Employee Save
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_EMPLOYEES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeFormData)
      });
      if (!response.ok) throw new Error('Failed to save employee.');
      
      showToast('Employee successfully added!', 'success');
      setEmployeeFormData({
        name: '',
        email: '',
        phone: '',
        department: 'IT Support',
        role: 'Engineer'
      });
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_EMPLOYEES_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete employee.');
      showToast('Employee removed successfully.', 'success');
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Device Save
  const handleSaveDevice = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_DEVICES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceFormData)
      });
      if (!response.ok) throw new Error('Failed to record device installation.');

      showToast('Device Installation successfully registered!', 'success');
      setDeviceFormData({
        customerName: '',
        companyName: '',
        deviceType: 'Biometric Scanner',
        deviceBrand: 'Anviz',
        modelNumber: '',
        serialNumber: '',
        installationLocation: '',
        engineerAssigned: employees.filter(emp => emp.role === 'Engineer')[0]?.name || '',
        status: 'Installed',
        installationDate: new Date().toISOString().split('T')[0],
        warrantyExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete Device
  const handleDeleteDevice = async (id) => {
    if (!window.confirm('Are you sure you want to remove this device installation?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_DEVICES_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete device.');
      showToast('Device record removed successfully.', 'success');
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Service Request Save
  const handleSaveServiceRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedDevice = devices.find(d => d.id === parseInt(serviceFormData.deviceId));
      if (!selectedDevice) {
        showToast('Please select a valid installed device.', 'error');
        setLoading(false);
        return;
      }

      // Automatically generate Ticket ID
      const nextTicketNum = services.length + 1;
      const ticketId = `SR-${String(nextTicketNum).padStart(3, '0')}`;

      const servicePayload = {
        ticketId,
        customerName: selectedDevice.customerName,
        device: selectedDevice,
        problemDescription: serviceFormData.problemDescription,
        priority: serviceFormData.priority,
        assignedEngineer: serviceFormData.assignedEngineer,
        status: 'Pending'
      };

      const response = await fetch(API_SERVICES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(servicePayload)
      });
      if (!response.ok) throw new Error('Failed to file service request ticket.');

      showToast(`Service Request Ticket ${ticketId} created!`, 'success');
      setServiceFormData({
        deviceId: '',
        problemDescription: '',
        priority: 'Medium',
        assignedEngineer: employees.filter(emp => emp.role === 'Engineer')[0]?.name || '',
        status: 'Pending'
      });
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update Service Status Workflow
  const handleUpdateServiceStatus = async (id, currentStatus) => {
    let nextStatus = 'Pending';
    if (currentStatus === 'Pending') nextStatus = 'Assigned';
    else if (currentStatus === 'Assigned') nextStatus = 'In Progress';
    else if (currentStatus === 'In Progress') nextStatus = 'Completed';
    else return; // already completed

    setLoading(true);
    try {
      const response = await fetch(`${API_SERVICES_URL}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error('Failed to update ticket status.');

      showToast(`Ticket status advanced to ${nextStatus}`, 'success');
      fetchData();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // QR Scanner Implementation
  const scannerRef = useRef(null);
  useEffect(() => {
    if (currentRoute.name === 'gatepass' && cameraActive) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      const onScanSuccess = async (decodedText) => {
        html5QrcodeScanner.clear();
        setCameraActive(false);
        processScanToken(decodedText);
      };

      const onScanFailure = (error) => {};

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);

      return () => {
        html5QrcodeScanner.clear().catch(err => console.error("Error clearing scanner", err));
      };
    }
  }, [currentRoute.name, cameraActive]);

  const processScanToken = async (token) => {
    setLoading(true);
    setScanResult(null);
    try {
      const response = await fetch(`${API_BASE_URL}/checkout/${token}`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || 'Checkout failed.');
      }
      
      const visitor = await response.json();
      setScanResult({
        success: true,
        message: 'Checked Out Successfully!',
        visitor
      });
      showToast(`${visitor.name} checked out!`, 'success');
      fetchData();
    } catch (error) {
      setScanResult({
        success: false,
        message: error.message || 'Invalid or expired QR code.'
      });
      showToast(error.message || 'Scan verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualScanSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    processScanToken(manualToken.trim());
    setManualToken('');
  };

  // Date Formatting helper
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Basic check date comparison for reports
  const isExpired = (expiryDateStr) => {
    const expiry = new Date(expiryDateStr);
    return expiry < new Date();
  };

  // Filter lists of employees for dropdown selection
  const engineersList = employees.filter(emp => emp.role === 'Engineer');
  const hostsList = employees.filter(emp => emp.role !== 'Engineer' && emp.role !== 'Security Guard');

  // Trigger print reports
  const triggerPrint = () => {
    window.print();
  };

  // Render Functions
  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast ${toast.type} no-print`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} color="var(--color-success)" />
          ) : (
            <AlertTriangle size={20} color="var(--color-danger)" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. STANDALONE PASS VIEW */}
      {currentRoute.name === 'pass' && (
        <div className="standalone-pass-container">
          <div className="text-center mb-20" style={{ marginTop: '10px' }}>
            <Shield size={28} color="var(--color-primary)" className="logo-icon" style={{ marginBottom: '8px' }} />
            <h2 className="logo-text" style={{ fontSize: '1.4rem', margin: 0 }}>ETERNITY INFOTECH</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Digital Access Gate Pass Control System</p>
          </div>
          
          {loading ? (
            <div className="flex-between" style={{ justifyContent: 'center', minHeight: '300px' }}>
              <div className="loader"></div>
            </div>
          ) : passError ? (
            <div className="glass-card text-center" style={{ maxWidth: '400px', margin: '0 auto', padding: '40px' }}>
              <AlertTriangle size={48} color="var(--color-danger)" style={{ marginBottom: '16px' }} />
              <h3 style={{ marginBottom: '8px' }}>Gate Pass Error</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{passError}</p>
              <button className="btn-primary" onClick={() => window.location.href = '/'}>
                Go to Main Site
              </button>
            </div>
          ) : passVisitor ? (
            <div className="badge-wrapper">
              <div className="digital-badge">
                <div className="badge-header">
                  <div className="badge-logo">ETERNITY <span>INFOTECH</span></div>
                  <span className={`badge-pill ${passVisitor.status === 'CHECKED_IN' ? 'checked-in' : ''}`} 
                        style={{ 
                          backgroundColor: passVisitor.status === 'CHECKED_IN' ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-success-bg)',
                          color: passVisitor.status === 'CHECKED_IN' ? 'var(--color-primary)' : 'var(--color-success)',
                          borderColor: passVisitor.status === 'CHECKED_IN' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                        }}>
                    {passVisitor.status === 'CHECKED_IN' ? 'ACTIVE PASS' : 'CHECKED OUT'}
                  </span>
                </div>
                
                <div className="badge-body">
                  <div className="badge-name">{passVisitor.name}</div>
                  <div className="badge-role">WALK-IN VISITOR</div>
                  
                  <div className="qr-container">
                    <QRCodeSVG 
                      value={passVisitor.token} 
                      size={120}
                      bgColor="#ffffff"
                      fgColor="#0a0e17"
                      level="Q"
                    />
                  </div>
                  
                  <div className="badge-details">
                    <div>
                      <div className="badge-label">Meet Host</div>
                      <div className="badge-value">{passVisitor.employeeName}</div>
                    </div>
                    <div>
                      <div className="badge-label">Purpose</div>
                      <div className="badge-value">{passVisitor.purpose}</div>
                    </div>
                    <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                      <div className="badge-label">Registered At</div>
                      <div className="badge-value">{formatDate(passVisitor.checkInTime)}</div>
                    </div>
                    {passVisitor.checkOutTime && (
                      <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                        <div className="badge-label">Checked Out At</div>
                        <div className="badge-value" style={{ color: 'var(--color-success)' }}>{formatDate(passVisitor.checkOutTime)}</div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="badge-footer">
                  <div className="badge-label">Gate Pass ID Token</div>
                  <div className="badge-token">{passVisitor.token}</div>
                </div>
              </div>
              
              <div className="text-center no-print" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                <button className="btn-download" style={{ margin: 0 }} onClick={() => window.print()}>
                  <Printer size={16} />
                  Print / Save PDF Pass
                </button>
                <button className="btn-primary" style={{ margin: 0, width: 'auto' }} onClick={() => navigateTo('dashboard', '/')}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* MAIN LAYOUT (WITH SIDEBAR) */}
      {currentRoute.name !== 'pass' && (
        <>
          {/* Left Sidebar */}
          <aside className="sidebar no-print">
            <div className="sidebar-logo">
              <Shield className="logo-icon" size={24} />
              <div>
                <h1 className="logo-text">ETERNITY SECURE</h1>
                <div className="logo-sub">Security Asset Control</div>
              </div>
            </div>

            <nav className="sidebar-menu">
              <button 
                className={`sidebar-link ${currentRoute.name === 'dashboard' ? 'active' : ''}`}
                onClick={() => navigateTo('dashboard', '/')}
              >
                <LayoutDashboard size={18} className="sidebar-icon" />
                Dashboard
              </button>

              <button 
                className={`sidebar-link ${currentRoute.name === 'visitors' ? 'active' : ''}`}
                onClick={() => navigateTo('visitors', '/visitors')}
              >
                <UserPlus size={18} className="sidebar-icon" />
                Visitor Management
              </button>

              <button 
                className={`sidebar-link ${currentRoute.name === 'gatepass' ? 'active' : ''}`}
                onClick={() => navigateTo('gatepass', '/scan')}
              >
                <ScanLine size={18} className="sidebar-icon" />
                QR Gate Pass
              </button>

              <button 
                className={`sidebar-link ${currentRoute.name === 'employees' ? 'active' : ''}`}
                onClick={() => navigateTo('employees', '/employees')}
              >
                <User size={18} className="sidebar-icon" />
                Employee Management
              </button>

              <div className="sidebar-divider"></div>

              <button 
                className={`sidebar-link ${currentRoute.name === 'devices' ? 'active' : ''}`}
                onClick={() => navigateTo('devices', '/devices')}
              >
                <Monitor size={18} className="sidebar-icon" />
                Device Installation
              </button>

              <button 
                className={`sidebar-link ${currentRoute.name === 'services' ? 'active' : ''}`}
                onClick={() => navigateTo('services', '/services')}
              >
                <Wrench size={18} className="sidebar-icon" />
                Service Requests
              </button>

              <button 
                className={`sidebar-link ${currentRoute.name === 'reports' ? 'active' : ''}`}
                onClick={() => navigateTo('reports', '/reports')}
              >
                <BarChart3 size={18} className="sidebar-icon" />
                Reports
              </button>

              <button 
                className={`sidebar-link ${currentRoute.name === 'settings' ? 'active' : ''}`}
                onClick={() => navigateTo('settings', '/settings')}
              >
                <Settings size={18} className="sidebar-icon" />
                Settings
              </button>
            </nav>
          </aside>

          {/* Right Content Panel */}
          <div className="content-wrapper">
            
            {/* Header displaying active screen status */}
            <header className="header no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>Home</span>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--color-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {currentRoute.name === 'gatepass' ? 'QR Scanner Checkpoint' : currentRoute.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="btn-download" style={{ margin: 0, padding: '6px 12px' }} onClick={fetchData} disabled={loading}>
                  <RefreshCw size={14} className={loading ? 'loader' : ''} />
                  Sync System
                </button>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Active Guard: <strong>Preeti Sharma</strong>
                </div>
              </div>
            </header>

            <main className="main-content">
              
              {/* 2.1 DASHBOARD ROUTE */}
              {currentRoute.name === 'dashboard' && (
                <div>
                  <div className="kpi-grid">
                    <div className="glass-card kpi-card">
                      <div className="kpi-icon-wrapper" style={{ color: 'var(--color-primary)', background: 'rgba(56, 189, 248, 0.08)' }}>
                        <UserPlus size={24} />
                      </div>
                      <div className="kpi-info">
                        <h3>Visitors Registered Today</h3>
                        <div className="kpi-val" style={{ color: 'var(--color-primary)' }}>{stats.visitorsToday}</div>
                      </div>
                    </div>

                    <div className="glass-card kpi-card">
                      <div className="kpi-icon-wrapper" style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)' }}>
                        <UserCheck size={24} />
                      </div>
                      <div className="kpi-info">
                        <h3>Currently Inside Premises</h3>
                        <div className="kpi-val" style={{ color: 'var(--color-success)' }}>{stats.currentlyInside}</div>
                      </div>
                    </div>

                    <div className="glass-card kpi-card">
                      <div className="kpi-icon-wrapper" style={{ color: 'var(--color-accent)', background: 'rgba(6, 182, 212, 0.08)' }}>
                        <Monitor size={24} />
                      </div>
                      <div className="kpi-info">
                        <h3>Devices Installed & Active</h3>
                        <div className="kpi-val" style={{ color: 'var(--color-accent)' }}>{stats.activeDevices} / {stats.devicesInstalled}</div>
                      </div>
                    </div>

                    <div className="glass-card kpi-card">
                      <div className="kpi-icon-wrapper" style={{ color: 'var(--color-warning)', background: 'var(--color-warning-bg)' }}>
                        <AlertTriangle size={24} />
                      </div>
                      <div className="kpi-info">
                        <h3>Pending Service Requests</h3>
                        <div className="kpi-val" style={{ color: 'var(--color-warning)' }}>{stats.pendingServices}</div>
                      </div>
                    </div>
                  </div>

                  <div className="dashboard-layout" style={{ marginTop: '24px' }}>
                    {/* Active Premises List */}
                    <div className="glass-card">
                      <h2 className="panel-title">
                        <Clock size={20} />
                        Active Visitors Inside
                      </h2>
                      <div className="table-container" style={{ maxHeight: '350px' }}>
                        {activeVisitors.length === 0 ? (
                          <div className="empty-state">
                            <User size={32} />
                            <p>No active visitors in the premises.</p>
                          </div>
                        ) : (
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Meet Host</th>
                                <th>Check-in</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeVisitors.slice(0, 5).map(v => (
                                <tr key={v.id}>
                                  <td>{v.name}</td>
                                  <td style={{ color: 'var(--color-primary)' }}>{v.employeeName}</td>
                                  <td>{formatDate(v.checkInTime)}</td>
                                  <td>
                                    <button className="btn-action" onClick={() => setSelectedVisitor(v)}>
                                      <Eye size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <button className="btn-download" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={() => navigateTo('visitors', '/visitors')}>
                        View All Visitors
                      </button>
                    </div>

                    {/* Pending Tickets List */}
                    <div className="glass-card">
                      <h2 className="panel-title">
                        <Wrench size={20} />
                        Active Service Tickets
                      </h2>
                      <div className="table-container" style={{ maxHeight: '350px' }}>
                        {services.filter(s => s.status !== 'Completed').length === 0 ? (
                          <div className="empty-state">
                            <CheckCircle2 size={32} color="var(--color-success)" />
                            <p>All service requests completed!</p>
                          </div>
                        ) : (
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Ticket ID</th>
                                <th>Device</th>
                                <th>Engineer</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {services.filter(s => s.status !== 'Completed').slice(0, 5).map(s => (
                                <tr key={s.id}>
                                  <td><strong>{s.ticketId}</strong></td>
                                  <td>{s.device.deviceType} ({s.device.deviceBrand})</td>
                                  <td>{s.assignedEngineer}</td>
                                  <td>
                                    <span className={`status-badge ${s.status.toLowerCase().replace(' ', '-')}`}>
                                      {s.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <button className="btn-download" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }} onClick={() => navigateTo('services', '/services')}>
                        View Service Workflow
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2.2 VISITOR MANAGEMENT */}
              {currentRoute.name === 'visitors' && (
                <div className="dashboard-layout">
                  {/* Left: Registration */}
                  <div className="glass-card">
                    <h2 className="panel-title">
                      <UserPlus size={20} />
                      Visitor Entry Pass Registration
                    </h2>
                    
                    <form onSubmit={handleRegisterVisitor}>
                      <div className="form-group">
                        <label className="form-label">Visitor Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required 
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <input 
                            type="tel" 
                            className="form-input" 
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Employee to Meet (Host Selection)</label>
                        <select 
                          className="form-input"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                          required
                          style={{ color: 'var(--text-main)' }}
                        >
                          <option value="" style={{ background: 'var(--bg-secondary)' }}>-- Select Eternity Employee --</option>
                          {hostsList.map(h => (
                            <option key={h.id} value={h.id} style={{ background: 'var(--bg-secondary)' }}>
                              {h.name} ({h.department} - {h.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Purpose of Visit</label>
                        <select 
                          className="form-input"
                          value={formData.purpose}
                          onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                          style={{ color: 'var(--text-main)' }}
                        >
                          <option value="Business Meeting" style={{ background: 'var(--bg-secondary)' }}>Business Meeting</option>
                          <option value="Interview" style={{ background: 'var(--bg-secondary)' }}>Job Interview</option>
                          <option value="Vendor / Delivery" style={{ background: 'var(--bg-secondary)' }}>Vendor / Delivery</option>
                          <option value="Personal Visit" style={{ background: 'var(--bg-secondary)' }}>Personal Visit</option>
                          <option value="Maintenance / IT Support" style={{ background: 'var(--bg-secondary)' }}>Maintenance / IT Support</option>
                        </select>
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <div className="loader"></div> : (
                          <>
                            <Sparkles size={18} />
                            Issue Digital Gate Pass
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right: Active list & checkout history */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Active Premises List */}
                    <div className="glass-card">
                      <h2 className="panel-title">
                        <Clock size={20} />
                        Active Checked-In Visitors
                      </h2>
                      <div className="table-container">
                        {activeVisitors.length === 0 ? (
                          <div className="empty-state">
                            <User size={36} />
                            <p>No active visitors in the premises right now.</p>
                          </div>
                        ) : (
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Visitor Details</th>
                                <th>Host / Purpose</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeVisitors.map(v => (
                                <tr key={v.id}>
                                  <td>
                                    <div className="visitor-meta">
                                      <span className="visitor-name">{v.name}</span>
                                      <span className="visitor-subtext">{v.phone}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="visitor-meta">
                                      <span className="visitor-name" style={{ color: 'var(--color-primary)' }}>{v.employeeName}</span>
                                      <span className="visitor-subtext">{v.purpose}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="actions-cell">
                                      <button className="btn-action" title="View Pass" onClick={() => setSelectedVisitor(v)}>
                                        <Eye size={16} />
                                      </button>
                                      <button className="btn-action checkout-action" title="Check Out" onClick={() => handleCheckout(v.token)}>
                                        <LogOut size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* History List */}
                    <div className="glass-card">
                      <h2 className="panel-title">
                        <History size={20} />
                        Checkout History Log
                      </h2>
                      <div className="table-container" style={{ maxHeight: '350px' }}>
                        {historyVisitors.length === 0 ? (
                          <div className="empty-state">
                            <History size={36} />
                            <p>No visitor history recorded yet.</p>
                          </div>
                        ) : (
                          <table className="custom-table">
                            <thead>
                              <tr>
                                <th>Visitor</th>
                                <th>Host Meet</th>
                                <th>Timing</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyVisitors.map(v => (
                                <tr key={v.id}>
                                  <td>
                                    <div className="visitor-meta">
                                      <span className="visitor-name">{v.name}</span>
                                      <span className="visitor-subtext">{v.email}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="visitor-meta">
                                      <span className="visitor-name">{v.employeeName}</span>
                                      <span className="visitor-subtext">{v.purpose}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="visitor-meta">
                                      <span className="visitor-subtext">In: {formatDate(v.checkInTime)}</span>
                                      <span className="visitor-subtext" style={{ color: 'var(--color-success)' }}>Out: {v.checkOutTime ? formatDate(v.checkOutTime) : '-'}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`status-badge ${v.status.toLowerCase().replace('_', '-')}`}>
                                      {v.status === 'CHECKED_IN' ? 'Inside' : 'Checked Out'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* 2.3 QR SCANNER ROUTE */}
              {currentRoute.name === 'gatepass' && (
                <div className="scanner-layout">
                  <div className="glass-card scanner-feed-card">
                    <h2 className="panel-title">
                      <ScanLine size={20} />
                      Checkpoint QR Code Scanner
                    </h2>
                    
                    <div className={`scanner-viewport ${cameraActive ? 'active' : ''}`}>
                      {cameraActive && <div className="scanner-laser"></div>}
                      {cameraActive ? (
                        <div id="qr-reader" style={{ width: '100%', height: '100%', border: 'none' }}></div>
                      ) : (
                        <div className="scanner-placeholder">
                          <Camera size={48} />
                          <p>Webcam scanner is currently offline.</p>
                          <button 
                            className="btn-primary" 
                            style={{ width: 'auto', padding: '10px 20px', marginTop: '10px' }}
                            onClick={() => setCameraActive(true)}
                          >
                            <Camera size={16} />
                            Activate Camera Scan
                          </button>
                        </div>
                      )}
                    </div>

                    {cameraActive && (
                      <button className="btn-download" style={{ marginTop: '20px' }} onClick={() => setCameraActive(false)}>
                        Deactivate Camera
                      </button>
                    )}

                    <div className="scanner-manual-box" style={{ marginTop: '24px' }}>
                      <form onSubmit={handleManualScanSubmit} className="glass-card" style={{ padding: '20px', background: 'rgba(10, 14, 23, 0.4)' }}>
                        <h3 className="form-label" style={{ marginBottom: '12px' }}>Fallback Pass Lookup (Enter Gate Pass ID)</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                          />
                          <button type="submit" className="btn-primary" style={{ width: '120px', margin: 0 }} disabled={loading}>
                            Verify
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="glass-card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    <h2 className="panel-title">
                      <CheckCircle2 size={20} />
                      Verification Status
                    </h2>

                    {!scanResult ? (
                      <div className="empty-state" style={{ margin: 'auto' }}>
                        <ScanLine size={48} />
                        <p>Scan a visitor's QR code or enter their ID to process checkout validation.</p>
                      </div>
                    ) : scanResult.success ? (
                      <div className="scan-result-card success" style={{ margin: 'auto 0' }}>
                        <div className="result-status-title success">
                          <CheckCircle2 size={24} />
                          Checked Out Successfully!
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                          The visitor has been checked out of the database and is cleared to exit the premises.
                        </p>
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          <div className="visitor-meta" style={{ gap: '8px' }}>
                            <div>
                              <span className="badge-label">Visitor Name</span>
                              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>{scanResult.visitor.name}</div>
                            </div>
                            <div>
                              <span className="badge-label">Host Met</span>
                              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{scanResult.visitor.employeeName}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                              <div>
                                <span className="badge-label">Checked In</span>
                                <div style={{ fontSize: '0.8rem' }}>{formatDate(scanResult.visitor.checkInTime)}</div>
                              </div>
                              <div>
                                <span className="badge-label">Checked Out</span>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600 }}>{formatDate(scanResult.visitor.checkOutTime)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="scan-result-card error" style={{ margin: 'auto 0' }}>
                        <div className="result-status-title error">
                          <AlertTriangle size={24} />
                          Verification Failed
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>{scanResult.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2.4 EMPLOYEE MANAGEMENT */}
              {currentRoute.name === 'employees' && (
                <div className="dashboard-layout">
                  {/* Register Employee */}
                  <div className="glass-card">
                    <h2 className="panel-title">
                      <UserPlus size={20} />
                      Register New Staff Record
                    </h2>
                    
                    <form onSubmit={handleSaveEmployee}>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. John Doe"
                          value={employeeFormData.name}
                          onChange={(e) => setEmployeeFormData({...employeeFormData, name: e.target.value})}
                          required 
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <input 
                            type="tel" 
                            className="form-input" 
                            placeholder="+91 XXXXX XXXXX"
                            value={employeeFormData.phone}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, phone: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <input 
                            type="email" 
                            className="form-input" 
                            placeholder="username@eternity.com"
                            value={employeeFormData.email}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Department</label>
                          <select 
                            className="form-input"
                            value={employeeFormData.department}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, department: e.target.value})}
                            style={{ color: 'var(--text-main)' }}
                          >
                            <option value="IT Support" style={{ background: 'var(--bg-secondary)' }}>IT Support</option>
                            <option value="Operations" style={{ background: 'var(--bg-secondary)' }}>Operations</option>
                            <option value="Maintenance" style={{ background: 'var(--bg-secondary)' }}>Maintenance</option>
                            <option value="Security" style={{ background: 'var(--bg-secondary)' }}>Security</option>
                            <option value="Reception" style={{ background: 'var(--bg-secondary)' }}>Reception</option>
                            <option value="Engineering" style={{ background: 'var(--bg-secondary)' }}>Engineering</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Role Designation</label>
                          <select 
                            className="form-input"
                            value={employeeFormData.role}
                            onChange={(e) => setEmployeeFormData({...employeeFormData, role: e.target.value})}
                            style={{ color: 'var(--text-main)' }}
                          >
                            <option value="Engineer" style={{ background: 'var(--bg-secondary)' }}>Engineer (Field Agent)</option>
                            <option value="Manager" style={{ background: 'var(--bg-secondary)' }}>Manager</option>
                            <option value="Security Guard" style={{ background: 'var(--bg-secondary)' }}>Security Guard</option>
                            <option value="Receptionist" style={{ background: 'var(--bg-secondary)' }}>Receptionist</option>
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <div className="loader"></div> : 'Register Staff Member'}
                      </button>
                    </form>
                  </div>

                  {/* Employees Table List */}
                  <div className="glass-card">
                    <h2 className="panel-title">
                      <User size={20} />
                      Registered Staff & Roles ({employees.length})
                    </h2>
                    <div className="table-container">
                      {employees.length === 0 ? (
                        <div className="empty-state">
                          <User size={36} />
                          <p>No employees registered in the system yet.</p>
                        </div>
                      ) : (
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Name & Email</th>
                              <th>Department</th>
                              <th>Role</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.map(emp => (
                              <tr key={emp.id}>
                                <td>
                                  <div className="visitor-meta">
                                    <span className="visitor-name">{emp.name}</span>
                                    <span className="visitor-subtext">{emp.email} | {emp.phone}</span>
                                  </div>
                                </td>
                                <td>{emp.department}</td>
                                <td>
                                  <span className={`status-badge ${emp.role === 'Engineer' ? 'in-progress' : 'assigned'}`}>
                                    {emp.role}
                                  </span>
                                </td>
                                <td>
                                  <button className="btn-action checkout-action" title="Delete Employee" onClick={() => handleDeleteEmployee(emp.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2.5 DEVICE INSTALLATION */}
              {currentRoute.name === 'devices' && (
                <div className="dashboard-layout">
                  {/* Record Installation */}
                  <div className="glass-card">
                    <h2 className="panel-title">
                      <Monitor size={20} />
                      Record New Device Installation
                    </h2>

                    <form onSubmit={handleSaveDevice}>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Customer Contact Name</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Vikas Mehra"
                            value={deviceFormData.customerName}
                            onChange={(e) => setDeviceFormData({...deviceFormData, customerName: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Client Company Name</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Techno Park Systems"
                            value={deviceFormData.companyName}
                            onChange={(e) => setDeviceFormData({...deviceFormData, companyName: e.target.value})}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Device Type Category</label>
                          <select 
                            className="form-input"
                            value={deviceFormData.deviceType}
                            onChange={(e) => setDeviceFormData({...deviceFormData, deviceType: e.target.value})}
                            style={{ color: 'var(--text-main)' }}
                          >
                            <option value="Biometric Scanner" style={{ background: 'var(--bg-secondary)' }}>Biometric Scanner</option>
                            <option value="CCTV Camera" style={{ background: 'var(--bg-secondary)' }}>CCTV Camera</option>
                            <option value="Fire Alarm" style={{ background: 'var(--bg-secondary)' }}>Fire Alarm</option>
                            <option value="Smart Lock" style={{ background: 'var(--bg-secondary)' }}>Smart Lock</option>
                            <option value="Metal Detector" style={{ background: 'var(--bg-secondary)' }}>Metal Detector</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Device Brand Manufacturer</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Hikvision, Honeywell"
                            value={deviceFormData.deviceBrand}
                            onChange={(e) => setDeviceFormData({...deviceFormData, deviceBrand: e.target.value})}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Model Number</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. DS-2CD2143"
                            value={deviceFormData.modelNumber}
                            onChange={(e) => setDeviceFormData({...deviceFormData, modelNumber: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Unique Serial Number</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. CAM-789012"
                            value={deviceFormData.serialNumber}
                            onChange={(e) => setDeviceFormData({...deviceFormData, serialNumber: e.target.value})}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Installation Location Room/Gate</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Server Room Entrance, Main Gate"
                            value={deviceFormData.installationLocation}
                            onChange={(e) => setDeviceFormData({...deviceFormData, installationLocation: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Assigned Engineer (Field Agent)</label>
                          <select 
                            className="form-input"
                            value={deviceFormData.engineerAssigned}
                            onChange={(e) => setDeviceFormData({...deviceFormData, engineerAssigned: e.target.value})}
                            required
                            style={{ color: 'var(--text-main)' }}
                          >
                            <option value="" style={{ background: 'var(--bg-secondary)' }}>-- Select Engineer --</option>
                            {engineersList.map(eng => (
                              <option key={eng.id} value={eng.name} style={{ background: 'var(--bg-secondary)' }}>
                                {eng.name} ({eng.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Installation Date</label>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={deviceFormData.installationDate}
                            onChange={(e) => setDeviceFormData({...deviceFormData, installationDate: e.target.value})}
                            required 
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Warranty Expiry Date</label>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={deviceFormData.warrantyExpiry}
                            onChange={(e) => setDeviceFormData({...deviceFormData, warrantyExpiry: e.target.value})}
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Deployment Status</label>
                        <select 
                          className="form-input"
                          value={deviceFormData.status}
                          onChange={(e) => setDeviceFormData({...deviceFormData, status: e.target.value})}
                          style={{ color: 'var(--text-main)' }}
                        >
                          <option value="Installed" style={{ background: 'var(--bg-secondary)' }}>Installed</option>
                          <option value="Active" style={{ background: 'var(--bg-secondary)' }}>Active</option>
                          <option value="Under Maintenance" style={{ background: 'var(--bg-secondary)' }}>Under Maintenance</option>
                          <option value="Replaced" style={{ background: 'var(--bg-secondary)' }}>Replaced</option>
                        </select>
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <div className="loader"></div> : 'Save Installation Record'}
                      </button>
                    </form>
                  </div>

                  {/* Devices Installed List */}
                  <div className="glass-card">
                    <h2 className="panel-title">
                      <Monitor size={20} />
                      Installed Asset Registry ({devices.length})
                    </h2>
                    <div className="table-container">
                      {devices.length === 0 ? (
                        <div className="empty-state">
                          <Monitor size={36} />
                          <p>No device installations registered yet.</p>
                        </div>
                      ) : (
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Device & Serial</th>
                              <th>Customer Details</th>
                              <th>Deployment Site</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {devices.map(dev => (
                              <tr key={dev.id}>
                                <td>
                                  <div className="visitor-meta">
                                    <span className="visitor-name">{dev.deviceType}</span>
                                    <span className="visitor-subtext">{dev.deviceBrand} {dev.modelNumber} | S/N: {dev.serialNumber}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="visitor-meta">
                                    <span className="visitor-name">{dev.customerName}</span>
                                    <span className="visitor-subtext">{dev.companyName}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="visitor-meta">
                                    <span className="visitor-name">{dev.installationLocation}</span>
                                    <span className="visitor-subtext">Engr: {dev.engineerAssigned}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`status-badge ${dev.status === 'Active' || dev.status === 'Installed' ? 'completed' : dev.status === 'Under Maintenance' ? 'pending' : 'assigned'}`}>
                                    {dev.status}
                                  </span>
                                </td>
                                <td>
                                  <button className="btn-action checkout-action" title="Delete Device" onClick={() => handleDeleteDevice(dev.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2.6 SERVICE REQUESTS */}
              {currentRoute.name === 'services' && (
                <div className="dashboard-layout">
                  {/* Create Ticket */}
                  <div className="glass-card">
                    <h2 className="panel-title">
                      <Wrench size={20} />
                      Generate New Service Ticket
                    </h2>

                    <form onSubmit={handleSaveServiceRequest}>
                      <div className="form-group">
                        <label className="form-label">Select Client Device Installation</label>
                        <select 
                          className="form-input"
                          value={serviceFormData.deviceId}
                          onChange={(e) => setServiceFormData({...serviceFormData, deviceId: e.target.value})}
                          required
                          style={{ color: 'var(--text-main)' }}
                        >
                          <option value="" style={{ background: 'var(--bg-secondary)' }}>-- Select Device --</option>
                          {devices.map(d => (
                            <option key={d.id} value={d.id} style={{ background: 'var(--bg-secondary)' }}>
                              {d.customerName} ({d.companyName}) - {d.deviceType} [{d.serialNumber}]
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fault / Problem Description</label>
                        <textarea 
                          className="form-input" 
                          placeholder="Provide details about the issue..."
                          rows={4}
                          value={serviceFormData.problemDescription}
                          onChange={(e) => setServiceFormData({...serviceFormData, problemDescription: e.target.value})}
                          required
                          style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '12px', borderRadius: 'var(--border-radius-sm)', resize: 'vertical' }}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Priority Urgency</label>
                          <select 
                            className="form-input"
                            value={serviceFormData.priority}
                            onChange={(e) => setServiceFormData({...serviceFormData, priority: e.target.value})}
                            style={{ color: 'var(--text-main)' }}
                          >
                            <option value="Low" style={{ background: 'var(--bg-secondary)' }}>Low Priority</option>
                            <option value="Medium" style={{ background: 'var(--bg-secondary)' }}>Medium Priority</option>
                            <option value="High" style={{ background: 'var(--bg-secondary)' }}>High Priority</option>
                            <option value="Critical" style={{ background: 'var(--bg-secondary)' }}>Critical Priority</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Assigned Dispatch Engineer</label>
                          <select 
                            className="form-input"
                            value={serviceFormData.assignedEngineer}
                            onChange={(e) => setServiceFormData({...serviceFormData, assignedEngineer: e.target.value})}
                            required
                            style={{ color: 'var(--text-main)' }}
                          >
                            <option value="" style={{ background: 'var(--bg-secondary)' }}>-- Select Engineer --</option>
                            {engineersList.map(eng => (
                              <option key={eng.id} value={eng.name} style={{ background: 'var(--bg-secondary)' }}>
                                {eng.name} ({eng.department})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <div className="loader"></div> : 'Register Service Ticket'}
                      </button>
                    </form>
                  </div>

                  {/* Active Services List and Workflow Progression */}
                  <div className="glass-card">
                    <h2 className="panel-title">
                      <Wrench size={20} />
                      Service Tracking & Workflow Action
                    </h2>
                    <div className="table-container">
                      {services.length === 0 ? (
                        <div className="empty-state">
                          <Wrench size={36} />
                          <p>No active service tickets filed.</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {services.map(ticket => (
                            <div key={ticket.id} className="glass-card" style={{ padding: '20px', background: 'rgba(10, 14, 23, 0.4)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              
                              <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                <div>
                                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', marginRight: '8px' }}>{ticket.ticketId}</span>
                                  <span className={`priority-badge ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                                </div>
                                <span className={`status-badge ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                                  {ticket.status}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                                <div>
                                  <div style={{ color: 'var(--text-muted)' }}>Customer / Company:</div>
                                  <div style={{ fontWeight: 600 }}>{ticket.customerName} ({ticket.device.companyName})</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--text-muted)' }}>Device / Serial Number:</div>
                                  <div>{ticket.device.deviceType} - Model {ticket.device.modelNumber} (S/N: {ticket.device.serialNumber})</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--text-muted)' }}>Problem Reported:</div>
                                  <div style={{ fontStyle: 'italic' }}>"{ticket.problemDescription}"</div>
                                </div>
                                <div>
                                  <div style={{ color: 'var(--text-muted)' }}>Assigned Tech Engineer:</div>
                                  <div style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{ticket.assignedEngineer}</div>
                                </div>
                              </div>

                              {/* Progress flow bar visual */}
                              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <div className={`ticket-flow-step ${ticket.status === 'Pending' ? 'active' : ''}`}>
                                  Pending
                                </div>
                                <div className={`ticket-flow-step ${ticket.status === 'Assigned' ? 'active' : ''}`}>
                                  Assigned
                                </div>
                                <div className={`ticket-flow-step ${ticket.status === 'In Progress' ? 'active' : ''}`}>
                                  In Progress
                                </div>
                                <div className={`ticket-flow-step ${ticket.status === 'Completed' ? 'active' : ''}`}>
                                  Completed
                                </div>

                                {ticket.status !== 'Completed' && (
                                  <button 
                                    className="btn-primary" 
                                    style={{ margin: 0, padding: '4px 10px', fontSize: '0.75rem', width: 'auto', background: 'var(--color-primary-hover)' }}
                                    onClick={() => handleUpdateServiceStatus(ticket.id, ticket.status)}
                                    disabled={loading}
                                  >
                                    Advance Workflow
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2.7 REPORTS ROUTE */}
              {currentRoute.name === 'reports' && (
                <div className="glass-card">
                  <div className="flex-between mb-20" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <h2 className="panel-title" style={{ border: 'none', margin: 0, padding: 0 }}>
                      <BarChart3 size={20} />
                      System Reports Engine
                    </h2>
                    <button className="btn-download" style={{ margin: 0 }} onClick={triggerPrint}>
                      <Printer size={16} />
                      Print / Save Report PDF
                    </button>
                  </div>

                  <div className="reports-tabs no-print">
                    <button 
                      className={`report-tab-btn ${activeReportTab === 'installations' ? 'active' : ''}`}
                      onClick={() => setActiveReportTab('installations')}
                    >
                      Installation Report
                    </button>
                    <button 
                      className={`report-tab-btn ${activeReportTab === 'services' ? 'active' : ''}`}
                      onClick={() => setActiveReportTab('services')}
                    >
                      Service Ticket History
                    </button>
                    <button 
                      className={`report-tab-btn ${activeReportTab === 'warranty' ? 'active' : ''}`}
                      onClick={() => setActiveReportTab('warranty')}
                    >
                      Warranty Expiry Tracker
                    </button>
                  </div>

                  {/* Installation Report View */}
                  {activeReportTab === 'installations' && (
                    <div>
                      <h3 style={{ marginBottom: '16px' }}>Device Installation Log Summary</h3>
                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Customer</th>
                              <th>Device Type</th>
                              <th>Serial Number</th>
                              <th>Install Date</th>
                              <th>Assigned Agent</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {devices.map(d => (
                              <tr key={d.id}>
                                <td><strong>{d.customerName}</strong> ({d.companyName})</td>
                                <td>{d.deviceType} ({d.deviceBrand})</td>
                                <td><code>{d.serialNumber}</code></td>
                                <td>{d.installationDate}</td>
                                <td>{d.engineerAssigned}</td>
                                <td>
                                  <span className={`status-badge ${d.status === 'Active' || d.status === 'Installed' ? 'completed' : 'pending'}`}>
                                    {d.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Service Ticket History View */}
                  {activeReportTab === 'services' && (
                    <div>
                      <h3 style={{ marginBottom: '16px' }}>Service Ticket Actions & Log History</h3>
                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Ticket ID</th>
                              <th>Customer</th>
                              <th>Fault Description</th>
                              <th>Priority</th>
                              <th>Assigned Tech</th>
                              <th>Date Filed</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {services.map(s => (
                              <tr key={s.id}>
                                <td><strong>{s.ticketId}</strong></td>
                                <td>{s.customerName}</td>
                                <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {s.problemDescription}
                                </td>
                                <td>
                                  <span className={`priority-badge ${s.priority.toLowerCase()}`}>
                                    {s.priority}
                                  </span>
                                </td>
                                <td>{s.assignedEngineer}</td>
                                <td>{s.requestDate}</td>
                                <td>
                                  <span className={`status-badge ${s.status.toLowerCase().replace(' ', '-')}`}>
                                    {s.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Warranty Expiry View */}
                  {activeReportTab === 'warranty' && (
                    <div>
                      <h3 style={{ marginBottom: '16px' }}>Active Warranties & Expiry Trackers</h3>
                      <div className="table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>Customer Name</th>
                              <th>Device Type</th>
                              <th>Serial Number</th>
                              <th>Warranty Expiry</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {devices.map(d => {
                              const expired = isExpired(d.warrantyExpiry);
                              return (
                                <tr key={d.id}>
                                  <td><strong>{d.customerName}</strong> ({d.companyName})</td>
                                  <td>{d.deviceType} ({d.deviceBrand})</td>
                                  <td><code>{d.serialNumber}</code></td>
                                  <td style={{ color: expired ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                                    {d.warrantyExpiry}
                                  </td>
                                  <td>
                                    <span className={`status-badge ${expired ? 'pending' : 'completed'}`}>
                                      {expired ? 'EXPIRED' : 'ACTIVE WARRANTY'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2.8 SETTINGS ROUTE */}
              {currentRoute.name === 'settings' && (
                <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <h2 className="panel-title">
                    <Settings size={20} />
                    System Options
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Security Asset Management v2.0</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        This system is deployed as an enterprise single-page application. Features visitor check-in/out, QR checkpoints, device inventory audits, and technical dispatch ticket workflows.
                      </p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Mail Notification Dispatcher</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                        Automatic email gatepass generation is currently routed through SMTP Maildev container on port 1025.
                      </p>
                      <span className="status-badge completed">SMTP: ONLINE</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn-primary" style={{ margin: 0 }} onClick={fetchData}>
                        Reload Databases
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </main>
          </div>
        </>
      )}

      {/* 4. DIALOG MODAL (POPUP BADGE FROM DASHBOARD LIST) */}
      {selectedVisitor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '90%', padding: '20px' }}>
            <div className="flex-between mb-20" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <span style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>Visitor Access Badge</span>
              <button 
                onClick={() => setSelectedVisitor(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold' 
                }}
              >
                &times;
              </button>
            </div>

            <div className="digital-badge">
              <div className="badge-header">
                <div className="badge-logo">ETERNITY <span>INFOTECH</span></div>
                <span className={`badge-pill ${selectedVisitor.status === 'CHECKED_IN' ? 'checked-in' : ''}`}
                      style={{ 
                        backgroundColor: selectedVisitor.status === 'CHECKED_IN' ? 'rgba(56, 189, 248, 0.1)' : 'var(--color-success-bg)',
                        color: selectedVisitor.status === 'CHECKED_IN' ? 'var(--color-primary)' : 'var(--color-success)',
                        borderColor: selectedVisitor.status === 'CHECKED_IN' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                      }}>
                  {selectedVisitor.status === 'CHECKED_IN' ? 'ACTIVE PASS' : 'CHECKED OUT'}
                </span>
              </div>
              
              <div className="badge-body">
                <div className="badge-name">{selectedVisitor.name}</div>
                <div className="badge-role">WALK-IN VISITOR</div>
                
                <div className="qr-container">
                  <QRCodeSVG 
                    value={selectedVisitor.token} 
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#0a0e17"
                    level="Q"
                  />
                </div>
                
                <div className="badge-details">
                  <div>
                    <div className="badge-label">Meet Host</div>
                    <div className="badge-value">{selectedVisitor.employeeName}</div>
                  </div>
                  <div>
                    <div className="badge-label">Purpose</div>
                    <div className="badge-value">{selectedVisitor.purpose}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                    <div className="badge-label">Check-In Time</div>
                    <div className="badge-value" style={{ fontSize: '0.8rem' }}>{formatDate(selectedVisitor.checkInTime)}</div>
                  </div>
                </div>
              </div>
              
              <div className="badge-footer">
                <div className="badge-label">Gate Pass ID</div>
                <div className="badge-token">{selectedVisitor.token}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                  className="btn-download" 
                  style={{ margin: 0, justifyContent: 'center' }}
                  onClick={() => {
                    setSelectedVisitor(null);
                    navigateTo('pass', `/pass/${selectedVisitor.token}`, { token: selectedVisitor.token });
                  }}
                >
                  <Printer size={16} />
                  Print Pass
                </button>
                {selectedVisitor.status === 'CHECKED_IN' ? (
                  <button 
                    className="btn-primary" 
                    style={{ margin: 0, background: 'linear-gradient(135deg, var(--color-success) 0%, #064e3b 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                    onClick={() => {
                      handleCheckout(selectedVisitor.token);
                    }}
                  >
                    <LogOut size={16} />
                    Checkout Now
                  </button>
                ) : (
                  <button 
                    className="btn-primary" 
                    style={{ margin: 0, background: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)' }}
                    onClick={() => setSelectedVisitor(null)}
                  >
                    Close Badge
                  </button>
                )}
              </div>
              {selectedVisitor.status === 'CHECKED_IN' && (
                <button 
                  className="btn-download" 
                  style={{ margin: 0, justifyContent: 'center', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  onClick={() => setSelectedVisitor(null)}
                >
                  Close Badge
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
