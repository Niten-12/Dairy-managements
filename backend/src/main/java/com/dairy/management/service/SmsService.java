package com.dairy.management.service;

public interface SmsService {
    /**
     * @param phone 10-digit Indian mobile number (without +91)
     * @param code  6-digit OTP
     */
    void sendOtp(String phone, String code);
}
