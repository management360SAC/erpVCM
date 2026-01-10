package com.vcm.crm.controller;

import com.vcm.crm.dto.UserDtos.CreateUserRequest;
import com.vcm.crm.dto.UserDtos.UpdateUserRequest;
import com.vcm.crm.dto.UserDtos.UserResponse;
import com.vcm.crm.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('users:read')")
    public ResponseEntity<List<UserResponse>> list() {
        return ResponseEntity.ok(userService.list());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('users:read')")
    public ResponseEntity<UserResponse> get(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.get(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('users:write') or hasRole('ADMIN')")
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody CreateUserRequest req
    ) {
        return ResponseEntity.ok(userService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('users:write') or hasRole('ADMIN')")
    public ResponseEntity<UserResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRequest req
    ) {
        return ResponseEntity.ok(userService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('users:delete') or hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPasswordPublic(@RequestBody ResetPasswordRequest body) {
        userService.resetPasswordByUsername(body.getUsername(), body.getNewPassword());
        return ResponseEntity.noContent().build();
    }

    static class ResetPasswordRequest {
        private String username;
        private String newPassword;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
