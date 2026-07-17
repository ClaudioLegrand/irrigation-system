package com.legrandc.irrigation_system.services;

import com.legrandc.irrigation_system.dtos.hardware.HardwareReportRequest;
import com.legrandc.irrigation_system.dtos.irrigationhistory.IrrigationHistoryResponse;

import java.util.List;

public interface IrrigationHistoryService {

    void processHardwareReport(HardwareReportRequest request);

    List<IrrigationHistoryResponse> getAllHistory();

    IrrigationHistoryResponse getHistoryById(Long id);

    void deleteHistory(Long id);
    
    List<IrrigationHistoryResponse> getHistoryBySectorId(Long sectorId);
}
