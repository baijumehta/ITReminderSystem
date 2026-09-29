-- Sample IT tasks for the proof of concept.
-- Due dates are relative to the day the seed runs, so the demo always has a
-- realistic mix of overdue, due-soon and future items.

INSERT INTO tasks (title, description, category, vendor, asset, priority, due_date, remind_days_before, recurrence, cost) VALUES

-- Certificates -------------------------------------------------------------
('Renew wildcard SSL certificate (*.contoso.com)',
 'Order renewal, complete DCV, then install on the web servers, the load balancer and the Exchange hybrid connector. Update the cert thumbprint in the documentation.',
 'Certificates', 'DigiCert', '*.contoso.com', 'high', CURRENT_DATE + 12, 30, 'annual', 699.00),

('Renew SSL certificate for VPN / remote access portal',
 'Certificate on the FortiGate SSL-VPN portal. Users get browser warnings if this lapses.',
 'Certificates', 'Sectigo', 'vpn.contoso.com', 'high', CURRENT_DATE + 41, 30, 'annual', 89.00),

('Renew Apple Push Notification (APNs) certificate in Intune',
 'Renew with the SAME Apple ID used originally or every enrolled iPhone/iPad must be re-enrolled. Apple ID is in the password vault under "Intune APNs".',
 'Certificates', 'Apple / Microsoft Intune', 'Intune MDM push certificate', 'critical', CURRENT_DATE + 19, 30, 'annual', NULL),

('Rotate client secret for Entra ID app registration (Payroll SSO)',
 'Secret expires on the due date. Create new secret, update it in the payroll vendor portal, then delete the old secret.',
 'Certificates', 'Microsoft Entra ID', 'App: Payroll-SSO', 'high', CURRENT_DATE + 55, 21, 'annual', NULL),

-- Security subscriptions ---------------------------------------------------
('Renew FortiGuard UTP security subscription – HQ firewall',
 'Unified Threat Protection bundle (IPS, AV, web filtering, app control). If it lapses, the firewall stops receiving signature updates. Get quote from reseller ~30 days out.',
 'Security Subscriptions', 'Fortinet', 'FortiGate 100F (HQ) – SN FG100FTK2200XXXX', 'critical', CURRENT_DATE + 24, 45, 'annual', 2450.00),

('Renew FortiGuard UTP security subscription – Branch firewall',
 'Same bundle as HQ. Try to co-term with the HQ renewal.',
 'Security Subscriptions', 'Fortinet', 'FortiGate 40F (Branch) – SN FGT40FTK2100XXXX', 'high', CURRENT_DATE + 67, 45, 'annual', 640.00),

('Renew EDR / antivirus subscription',
 'SentinelOne Complete – 85 endpoints. Confirm seat count before renewing.',
 'Security Subscriptions', 'SentinelOne', '85 endpoints', 'critical', CURRENT_DATE - 3, 30, 'annual', 5100.00),

('Renew email security / spam filtering',
 'Mimecast Email Security. Review mailbox count first.',
 'Security Subscriptions', 'Mimecast', '72 mailboxes', 'high', CURRENT_DATE + 98, 30, 'annual', 2880.00),

-- Licensing & domains ------------------------------------------------------
('Microsoft 365 annual license renewal',
 'M365 Business Premium. True-up seat count against active users in the admin center before renewal.',
 'Licensing', 'Microsoft (via CSP)', 'M365 Business Premium x 72', 'high', CURRENT_DATE + 76, 30, 'annual', 15552.00),

('Renew Veeam Backup & Replication license',
 'Covers the Hyper-V hosts. License file must be re-applied in the Veeam console after renewal.',
 'Licensing', 'Veeam', 'VBR – 4 sockets', 'high', CURRENT_DATE + 33, 30, 'annual', 1980.00),

('Renew domain name contoso.com',
 'Auto-renew is OFF at the registrar. Verify credit card on file and renew for at least 2 years.',
 'Domains', 'GoDaddy', 'contoso.com', 'critical', CURRENT_DATE + 49, 30, 'annual', 45.00),

('Renew domain name contoso-mail.net',
 'Legacy domain still used for mail routing. Confirm it is still needed before renewing.',
 'Domains', 'GoDaddy', 'contoso-mail.net', 'normal', CURRENT_DATE + 140, 30, 'annual', 22.00),

-- Hardware & support contracts ---------------------------------------------
('Renew Dell ProSupport warranty – Hyper-V host HV01',
 'Server is 4 years old. Decide: extend warranty 1 year vs. budget for replacement.',
 'Hardware', 'Dell', 'PowerEdge R650 – HV01 (Service Tag ABC1234)', 'normal', CURRENT_DATE + 88, 60, 'none', 1150.00),

('Replace UPS batteries – server room',
 'APC Smart-UPS reported battery replacement recommended. Order RBC55 kit.',
 'Hardware', 'APC', 'Smart-UPS 3000 – Server room', 'normal', CURRENT_DATE + 8, 14, 'none', 420.00),

-- Patching (recurring, routine) --------------------------------------------
('Push Windows Updates to Hyper-V host servers',
 'Monthly Patch Tuesday cycle. Live-migrate VMs off each host, install updates, reboot, verify cluster health, then move VMs back. Hosts: HV01, HV02.',
 'Patching', 'Microsoft', 'HV01, HV02', 'high', CURRENT_DATE + 2, 3, 'monthly', NULL),

('Push Windows Updates to Hyper-V guest VMs',
 'Approve and deploy updates to DC01, DC02, FS01, SQL01, APP01. Stagger domain controller reboots.',
 'Patching', 'Microsoft', 'All production VMs', 'normal', CURRENT_DATE + 4, 3, 'monthly', NULL),

('Update firewall firmware (FortiOS)',
 'Check Fortinet PSIRT advisories, review release notes and the upgrade path, back up config first.',
 'Patching', 'Fortinet', 'FortiGate 100F, FortiGate 40F', 'normal', CURRENT_DATE + 15, 7, 'quarterly', NULL),

-- Routine operations -------------------------------------------------------
('Test restore from backup',
 'Restore one VM and a random file share folder to the isolated test network. Record the result for cyber insurance.',
 'Backups', 'Veeam', 'FS01, SQL01', 'normal', CURRENT_DATE - 1, 5, 'monthly', NULL),

('Review stale / disabled Active Directory accounts',
 'Disable accounts inactive 90+ days, remove leavers from groups, check for accounts with password never expires.',
 'Accounts & Access', NULL, 'Active Directory / Entra ID', 'normal', CURRENT_DATE + 27, 7, 'quarterly', NULL),

('Rotate break-glass admin account passwords',
 'Global admin emergency accounts. Update sealed envelope in the safe and the password vault.',
 'Accounts & Access', 'Microsoft Entra ID', '2 break-glass accounts', 'high', CURRENT_DATE + 62, 7, 'semiannual', NULL),

('Review firewall rules and remove unused policies',
 'Look for any/any rules, disabled policies and rules with zero hit count.',
 'Compliance', 'Fortinet', 'FortiGate 100F (HQ)', 'low', CURRENT_DATE + 110, 14, 'semiannual', NULL),

('Complete cyber insurance renewal questionnaire',
 'Needs MFA coverage, backup testing evidence and EDR details. Broker needs it 3 weeks before policy renewal.',
 'Compliance', 'Insurance broker', 'Cyber liability policy', 'high', CURRENT_DATE + 36, 30, 'annual', NULL);

-- A couple of completed tasks so the history view has something in it.
INSERT INTO tasks (title, description, category, vendor, asset, priority, due_date, remind_days_before, recurrence, status, completed_at, completion_notes) VALUES
('Push Windows Updates to Hyper-V host servers',
 'Monthly Patch Tuesday cycle. Live-migrate VMs off each host, install updates, reboot, verify cluster health, then move VMs back. Hosts: HV01, HV02.',
 'Patching', 'Microsoft', 'HV01, HV02', 'high', CURRENT_DATE - 28, 3, 'none', 'completed',
 now() - INTERVAL '27 days', 'Both hosts patched. HV02 needed a second reboot. Cluster validation passed.'),
('Renew SSL certificate for mail.contoso.com',
 'Exchange hybrid / SMTP certificate.',
 'Certificates', 'DigiCert', 'mail.contoso.com', 'high', CURRENT_DATE - 45, 30, 'none', 'completed',
 now() - INTERVAL '50 days', 'Renewed for 1 year and installed on Exchange hybrid server. Old cert removed.');
