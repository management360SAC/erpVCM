package com.vcm.crm.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class PasswordResetRequest {
    private String username;
    private String newPassword;
}
