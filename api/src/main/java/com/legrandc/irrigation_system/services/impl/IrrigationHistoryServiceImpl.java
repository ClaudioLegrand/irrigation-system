package com.legrandc.irrigation_system.services.impl;

import com.legrandc.irrigation_system.dtos.hardware.HardwareReportRequest;
import com.legrandc.irrigation_system.dtos.irrigationhistory.IrrigationHistoryResponse;
import com.legrandc.irrigation_system.exceptions.ResourceNotFoundException;
import com.legrandc.irrigation_system.models.IrrigationHistory;
import com.legrandc.irrigation_system.models.Sector;
import com.legrandc.irrigation_system.models.SectorState;
import com.legrandc.irrigation_system.repository.IrrigationHistoryRepository;
import com.legrandc.irrigation_system.repository.SectorRepository;
import com.legrandc.irrigation_system.services.IrrigationHistoryService;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IrrigationHistoryServiceImpl implements IrrigationHistoryService {

    @Autowired
    private final IrrigationHistoryRepository historyRepository;

    @Autowired
    private final SectorRepository sectorRepository;

    public IrrigationHistoryServiceImpl(IrrigationHistoryRepository historyRepository,
                                        SectorRepository sectorRepository) {
        this.historyRepository = historyRepository;
        this.sectorRepository = sectorRepository;
    }

    @Override
    public List<IrrigationHistoryResponse> getAllHistory() {

        List<IrrigationHistoryResponse> responses = historyRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return responses;
    }

    @Override
    public IrrigationHistoryResponse getHistoryById(Long id) {

        IrrigationHistory history = findHistoryOrThrow(id);

        return toResponse(history);
    }

    @Override
    public void deleteHistory(Long id) {
        IrrigationHistory history = findHistoryOrThrow(id);
        historyRepository.delete(history);
    }

    @Override
    public List<IrrigationHistoryResponse> getHistoryBySectorId(Long sectorId) {
        findSectorOrThrow(sectorId);
        return historyRepository.findBySectorId(sectorId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    private IrrigationHistory findHistoryOrThrow(Long id) {
        return historyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("History not found with id " + id));
    }

    private Sector findSectorOrThrow(Long id) {
        return sectorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sector not found with id " + id));
    }

    @Transactional
    public void processHardwareReport(HardwareReportRequest request) {

        Sector sector = sectorRepository.findById(request.getSectorId())
                .orElseThrow(() -> new RuntimeException("Sector no found with id " + request.getSectorId()));

        if ("ON".equalsIgnoreCase(request.getStatus())) {

            if (sector.getCurrentState() == SectorState.ACTIVE) {
            return;
            }   

            IrrigationHistory newHistory = new IrrigationHistory();
            newHistory.setSector(sector);
            newHistory.setStartDateTime(LocalDateTime.now());
            newHistory.setOriginOrder(request.getOriginOrder());
            
            historyRepository.save(newHistory);
            
            sector.setCurrentState(SectorState.ACTIVE);
            sectorRepository.save(sector);

        } else if ("OFF".equalsIgnoreCase(request.getStatus())) {
            
            if (sector.getCurrentState() == SectorState.INACTIVE) {
                return;
            }

            IrrigationHistory openHistory = historyRepository
                    .findFirstBySectorIdAndEndDateTimeIsNullOrderByStartDateTimeDesc(sector.getId()).orElseThrow(() -> new RuntimeException("No hay un riego abierto para este sector"));

            openHistory.setEndDateTime(LocalDateTime.now());
            historyRepository.save(openHistory);

            sector.setCurrentState(SectorState.INACTIVE);
            sectorRepository.save(sector);
        }
    }

    private IrrigationHistoryResponse toResponse(IrrigationHistory history) {
        IrrigationHistoryResponse response = new IrrigationHistoryResponse();
        response.setId(history.getId());
        response.setSectorId(history.getSector() != null ? history.getSector().getId() : null);
        response.setStartDateTime(history.getStartDateTime());
        response.setEndDateTime(history.getEndDateTime());
        response.setOriginOrder(history.getOriginOrder() != null ? history.getOriginOrder().name() : null);

        return response;
    }
}
