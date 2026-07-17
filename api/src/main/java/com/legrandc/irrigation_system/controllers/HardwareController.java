package com.legrandc.irrigation_system.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.legrandc.irrigation_system.dtos.ApiResponse;
import com.legrandc.irrigation_system.dtos.hardware.HardwareReportRequest;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationResponse;
import com.legrandc.irrigation_system.services.IrrigationConfigurationService;
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

    @Autowired
    private final IrrigationConfigurationService configurationService;

    public HardwareController(IrrigationHistoryService historyService, IrrigationConfigurationService configurationService) {
        this.historyService = historyService;
        this.configurationService = configurationService;
    }

    @Operation(summary = "Get hardware configurations", description = "Retrieves the active irrigation configurations for a specific hardware sector.")
    @GetMapping("/sector/{sectorId}/config")
    public ResponseEntity<List<IrrigationConfigurationResponse>> getHardwareConfig(@PathVariable Long sectorId) {
        
        List<IrrigationConfigurationResponse> activeConfigs = 
                configurationService.getActiveConfigurationsForHardware(sectorId);
                
        return ResponseEntity.ok(activeConfigs);
    }

    @Operation(summary = "Create a hardware report", description = "Creates a new hardware report from the provided request body.")
    @PostMapping("/report")
    public ResponseEntity<ApiResponse> receiveDeviceReport(@Valid @RequestBody HardwareReportRequest request) {

        historyService.processHardwareReport(request);
        
        return ResponseEntity.ok(new ApiResponse("Hardware report processed successfully")); 
    }

}
