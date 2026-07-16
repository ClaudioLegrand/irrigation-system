package com.legrandc.irrigation_system.controllers;

import com.legrandc.irrigation_system.dtos.ApiResponse;
import com.legrandc.irrigation_system.dtos.irrigationhistory.IrrigationHistoryResponse;
import com.legrandc.irrigation_system.services.IrrigationHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@Tag(name = "Irrigation History", description = "Manage irrigation history records")
public class IrrigationHistoryController {

    @Autowired
    private final IrrigationHistoryService historyService;

    public IrrigationHistoryController(IrrigationHistoryService historyService) {
        this.historyService = historyService;
    }

    @Operation(summary = "Get all history records", description = "Returns every irrigation history record stored in the system.")
    @GetMapping
    public ResponseEntity<List<IrrigationHistoryResponse>> getAllHistory() {

        List<IrrigationHistoryResponse> responses = historyService.getAllHistory();

        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Get history by id", description = "Returns a single irrigation history record using its identifier.")
    @GetMapping("/{id}")
    public ResponseEntity<IrrigationHistoryResponse> getHistoryById(@PathVariable Long id) {
        
        IrrigationHistoryResponse response = historyService.getHistoryById(id);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get history by sector", description = "Returns all irrigation history records associated with a specific sector.")
    @GetMapping("/sector/{sectorId}")
    public ResponseEntity<List<IrrigationHistoryResponse>> getHistoryBySectorId(@PathVariable Long sectorId) {
        List<IrrigationHistoryResponse> responses = historyService.getHistoryBySectorId(sectorId);

        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Delete a history record", description = "Deletes an irrigation history record by its identifier.")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteHistory(@PathVariable Long id) {
        historyService.deleteHistory(id);
        
        return ResponseEntity.ok(new ApiResponse("History record successfully deleted"));
    }

}
