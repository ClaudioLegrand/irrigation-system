package com.legrandc.irrigation_system.controllers;

import com.legrandc.irrigation_system.dtos.ApiResponse;
import com.legrandc.irrigation_system.dtos.sector.EnabledRequest;
import com.legrandc.irrigation_system.dtos.sector.SectorRequest;
import com.legrandc.irrigation_system.dtos.sector.SectorResponse;
import com.legrandc.irrigation_system.dtos.sector.SectorStateRequest;
import com.legrandc.irrigation_system.services.SectorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sectors")
@Tag(name = "Sectors", description = "Manage irrigation sectors")
public class SectorController {

    @Autowired
    private final SectorService sectorService;

    public SectorController(SectorService sectorService) {
        this.sectorService = sectorService;
    }

    @Operation(summary = "Get all sectors", description = "Returns every sector defined in the irrigation system.")
    @GetMapping
    public ResponseEntity<List<SectorResponse>> getAllSectors() {

        List<SectorResponse> response = sectorService.getAllSectors();

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get sector by id", description = "Returns a single sector using its identifier.")
    @GetMapping("/{id}")
    public ResponseEntity<SectorResponse> getSectorById(@PathVariable Long id) {

        SectorResponse response = sectorService.getSectorById(id);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update a sector", description = "Updates an existing sector using the provided payload.")
    @PutMapping("/{id}")
    public ResponseEntity<SectorResponse> updateSector(@PathVariable Long id, @Valid @RequestBody SectorRequest request) {
        SectorResponse response = sectorService.updateSector(id, request);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Update multiple Sector", description = "Update multiple new Sector from the provided list of request bodies.")
    @PutMapping("/list")
    public ResponseEntity<ApiResponse> updateSectorInBatch(@Valid @RequestBody List<EnabledRequest> listRequest) {
        
        sectorService.updateSectorInBatch(listRequest);

        return ResponseEntity.ok(new ApiResponse("Sector successfully update"));
    }

    @Operation(summary = "Delete a sector", description = "Deletes a sector by its identifier.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteSector(@PathVariable Long id) {
        sectorService.deleteSector(id);

        return ResponseEntity.ok(new ApiResponse("Sector successfully deleted"));
    }

    @Operation(summary = "Change sector state", description = "Manually turn a sector ON (ACTIVE) or OFF (INACTIVE).")
    @PatchMapping("/{id}/state")
    public ResponseEntity<SectorResponse> changeSectorState(
            @PathVariable Long id, 
            @Valid @RequestBody SectorStateRequest request) {

        SectorResponse response = sectorService.changeState(id, request);
        
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Create a sector", description = "Creates a new sector from the provided request body.")
    @PostMapping
    public ResponseEntity<SectorResponse> createSector(@Valid @RequestBody SectorRequest request) {

        SectorResponse response = sectorService.createSector(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
