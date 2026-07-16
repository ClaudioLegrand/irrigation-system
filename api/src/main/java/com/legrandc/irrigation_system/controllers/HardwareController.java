package com.legrandc.irrigation_system.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.legrandc.irrigation_system.dtos.ApiResponse;
import com.legrandc.irrigation_system.dtos.hardware.HardwareReportRequest;
import com.legrandc.irrigation_system.services.IrrigationHistoryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/hardware")
@Tag(name = "Hardware Interface", description = "Endpoints exclusively for IoT devices")
public class HardwareController {
    
    @Autowired
    private final IrrigationHistoryService historyService;

    public HardwareController(IrrigationHistoryService historyService) {
        this.historyService = historyService;
    }

    @Operation(summary = "Create a hardware report", description = "Creates a new hardware report from the provided request body.")
    @PostMapping("/report")
    public ResponseEntity<ApiResponse> receiveDeviceReport(@Valid @RequestBody HardwareReportRequest request) {

        historyService.processHardwareReport(request);
        
        return ResponseEntity.ok(new ApiResponse("Hardware report processed successfully")); 
    }
}
