package com.vcm.crm.service;

import com.vcm.crm.entity.Reminder;
import com.vcm.crm.dto.ReminderRequest;
import com.vcm.crm.repository.ReminderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReminderService {
    
    private final ReminderRepository reminderRepository;
    
    public Page<Reminder> listReminders(Boolean onlyActive, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        if (onlyActive != null && onlyActive) {
            return reminderRepository.findByIsActive(true, pageable);
        }
        return reminderRepository.findAll(pageable);
    }
    
    @Transactional
    public Reminder createReminder(ReminderRequest request) {
        Reminder reminder = new Reminder();
        reminder.setTitle(request.getTitle());
        reminder.setDescription(request.getDescription());
        reminder.setDueAt(request.getDueAt());
        reminder.setRepeatEvery(request.getRepeatEvery() != null ? request.getRepeatEvery() : Reminder.RepeatEvery.NONE);
        reminder.setChannel(request.getChannel() != null ? request.getChannel() : Reminder.Channel.INAPP);
        reminder.setEntityType(request.getEntityType() != null ? request.getEntityType() : Reminder.EntityType.OTHER);
        reminder.setEntityId(request.getEntityId());
        reminder.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        reminder.setNextRunAt(request.getDueAt());
        
        return reminderRepository.save(reminder);
    }
    
    @Transactional
    public Reminder updateReminder(Integer id, ReminderRequest request) {  // ⚠️ Integer
        Reminder reminder = reminderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reminder not found"));
        
        if (request.getTitle() != null) reminder.setTitle(request.getTitle());
        if (request.getDescription() != null) reminder.setDescription(request.getDescription());
        if (request.getDueAt() != null) {
            reminder.setDueAt(request.getDueAt());
            reminder.setNextRunAt(request.getDueAt());
        }
        if (request.getRepeatEvery() != null) reminder.setRepeatEvery(request.getRepeatEvery());
        if (request.getChannel() != null) reminder.setChannel(request.getChannel());
        if (request.getEntityType() != null) reminder.setEntityType(request.getEntityType());
        if (request.getEntityId() != null) reminder.setEntityId(request.getEntityId());
        if (request.getIsActive() != null) reminder.setIsActive(request.getIsActive());
        
        return reminderRepository.save(reminder);
    }
    
    @Transactional
    public Reminder toggleReminder(Integer id, Boolean isActive) {  // ⚠️ Integer
        Reminder reminder = reminderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reminder not found"));
        reminder.setIsActive(isActive);
        return reminderRepository.save(reminder);
    }
    
    @Transactional
    public void deleteReminder(Integer id) {  // ⚠️ Integer
        reminderRepository.deleteById(id);
    }
    
    @Transactional
    public void triggerReminder(Integer id) {  // ⚠️ Integer
        Reminder reminder = reminderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reminder not found"));
        
        System.out.println("Triggering reminder: " + reminder.getTitle());
        
        if (reminder.getRepeatEvery() != Reminder.RepeatEvery.NONE) {
            LocalDateTime nextRun = calculateNextRun(reminder.getNextRunAt(), reminder.getRepeatEvery());
            reminder.setNextRunAt(nextRun);
            reminderRepository.save(reminder);
        }
    }
    
    private LocalDateTime calculateNextRun(LocalDateTime current, Reminder.RepeatEvery repeat) {
        switch (repeat) {
            case DAILY:
                return current.plusDays(1);
            case WEEKLY:
                return current.plusWeeks(1);
            case MONTHLY:
                return current.plusMonths(1);
            default:
                return current;
        }
    }
}