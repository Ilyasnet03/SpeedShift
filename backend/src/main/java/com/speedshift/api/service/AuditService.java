package com.speedshift.api.service;

import com.speedshift.api.dto.FeatureDtos.AuditEntry;
import com.speedshift.api.entity.AuditLog;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(User admin, String action, String targetType, Long targetId, String details) {
        auditLogRepository.save(AuditLog.builder()
            .adminId(admin == null ? null : admin.getId())
            .adminEmail(admin == null ? null : admin.getEmail())
            .action(action)
            .targetType(targetType)
            .targetId(targetId)
            .details(details == null || details.length() <= 500 ? details : details.substring(0, 500))
            .createdAt(LocalDateTime.now())
            .build());
    }

    public List<AuditEntry> recent(int limit) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.min(Math.max(limit, 1), 500))).stream()
            .map(entry -> new AuditEntry(entry.getId(), entry.getAdminEmail(), entry.getAction(), entry.getTargetType(),
                entry.getTargetId(), entry.getDetails(), entry.getCreatedAt()))
            .toList();
    }
}
