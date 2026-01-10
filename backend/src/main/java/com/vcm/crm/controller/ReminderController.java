package com.vcm.crm.controller;

import com.vcm.crm.dto.ReminderRequest;
import com.vcm.crm.entity.Reminder;
import com.vcm.crm.service.ReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alerts-reminders")
@RequiredArgsConstructor
public class ReminderController {
    
    private final ReminderService reminderService;
    
    @GetMapping("/reminders")
    public ResponseEntity<Page<Reminder>> listReminders(
            @RequestParam(required = false) Boolean onlyActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reminderService.listReminders(onlyActive, page, size));
    }
    
    @PostMapping("/reminders")
    public ResponseEntity<Reminder> createReminder(@RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.createReminder(request));
    }
    
    @PutMapping("/reminders/{id}")
    public ResponseEntity<Reminder> updateReminder(
            @PathVariable Integer id,  // ⚠️ Integer
            @RequestBody ReminderRequest request) {
        return ResponseEntity.ok(reminderService.updateReminder(id, request));
    }
    
    @PatchMapping("/reminders/{id}/toggle")
    public ResponseEntity<Reminder> toggleReminder(
            @PathVariable Integer id,  // ⚠️ Integer
            @RequestBody ToggleRequest request) {
        return ResponseEntity.ok(reminderService.toggleReminder(id, request.getIsActive()));
    }
    
    @DeleteMapping("/reminders/{id}")
    public ResponseEntity<Void> deleteReminder(@PathVariable Integer id) {  // ⚠️ Integer
        reminderService.deleteReminder(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/reminders/{id}/trigger")
    public ResponseEntity<Void> triggerReminder(@PathVariable Integer id) {  // ⚠️ Integer
        reminderService.triggerReminder(id);
        return ResponseEntity.ok().build();
    }
    
    @lombok.Data
    static class ToggleRequest {
        private Boolean isActive;
    }
}