package com.vcm.crm.service;

import com.vcm.crm.dto.UserDtos.CreateUserRequest;
import com.vcm.crm.dto.UserDtos.UpdateUserRequest;
import com.vcm.crm.dto.UserDtos.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> list();

    UserResponse get(Integer id);

    UserResponse create(CreateUserRequest req);

    UserResponse update(Integer id, UpdateUserRequest req);

    void delete(Integer id);

    void resetPasswordByUsername(String username, String newPassword);
}
