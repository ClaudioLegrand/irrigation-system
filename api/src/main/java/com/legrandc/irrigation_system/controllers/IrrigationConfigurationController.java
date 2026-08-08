package com.legrandc.irrigation_system.controllers;

import com.legrandc.irrigation_system.dtos.ApiResponse;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationRequest;
import com.legrandc.irrigation_system.dtos.irrigationconfiguration.IrrigationConfigurationResponse;
import com.legrandc.irrigation_system.services.IrrigationConfigurationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/configurations")
@Tag(name = "Irrigation Configurations", description = "Manage irrigation configuration records")
public class IrrigationConfigurationController {

    @Autowired
    private final IrrigationConfigurationService configurationService;

    public IrrigationConfigurationController(IrrigationConfigurationService configurationService) {
        this.configurationService = configurationService;
    }

    @Operation(summary = "Get all configurations", description = "Returns every irrigation configuration stored in the system.")
    @GetMapping
    public ResponseEntity<List<IrrigationConfigurationResponse>> getAllConfigurations() {

        List<IrrigationConfigurationResponse> configurations = configurationService.getAllConfigurations();

        return ResponseEntity.ok(configurations);
    }

    @Operation(summary = "Get configuration by id", description = "Returns a single irrigation configuration using its identifier.")
    @GetMapping("/{id}")
    public ResponseEntity<IrrigationConfigurationResponse> getConfigurationById(@PathVariable Long id) {

        IrrigationConfigurationResponse configuration = configurationService.getConfigurationById(id);

        return ResponseEntity.ok(configuration);
    }

    @Operation(summary = "Get configurations by sector", description = "Returns all irrigation configurations associated with a specific sector.")
    @GetMapping("/sector/{sectorId}")
    public ResponseEntity<List<IrrigationConfigurationResponse>> getConfigurationsBySectorId(@PathVariable Long sectorId) {

        List<IrrigationConfigurationResponse> configurations = configurationService.getConfigurationsBySectorId(sectorId);

        return ResponseEntity.ok(configurations);
    }

    @Operation(summary = "Update a configuration", description = "Updates an existing irrigation configuration using the provided payload.")
    @PutMapping("/{id}")
    public ResponseEntity<IrrigationConfigurationResponse> updateConfiguration(@PathVariable Long id, @Valid @RequestBody IrrigationConfigurationRequest request) {

        IrrigationConfigurationResponse updatedConfiguration = configurationService.updateConfiguration(id, request);

        return ResponseEntity.ok(updatedConfiguration);
    }

    @Operation(summary = "Update multiple configurations", description = "Update multiple new irrigation configurations from the provided list of request bodies.")
    @PutMapping("/list")
    public ResponseEntity<ApiResponse> updateConfigurationsInBatch(@Valid @RequestBody List<IrrigationConfigurationRequest> listRequest) {
        
        configurationService.updateConfigurationsInBatch(listRequest);

        return ResponseEntity.ok(new ApiResponse("Configurations successfully updated"));
    }

    @Operation(summary = "Delete a configuration", description = "Deletes an irrigation configuration by its identifier.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteConfiguration(@PathVariable Long id) {
        configurationService.deleteConfiguration(id);
        return ResponseEntity.ok(new ApiResponse("Configuration successfully deleted"));
    }


    @Operation(summary = "Create multiple configurations", description = "Creates multiple new irrigation configurations from the provided list of request bodies.")
    @PostMapping("/list")
    public ResponseEntity<ApiResponse> createListConfiguration(@Valid @RequestBody List<IrrigationConfigurationRequest> listRequest) {

        configurationService.createConfigurationsInBatch(listRequest);

        return ResponseEntity.ok(new ApiResponse("Configurations successfully created"));
    }
}
