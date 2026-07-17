package com.legrandc.irrigation_system.repository;

import com.legrandc.irrigation_system.models.IrrigationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IrrigationHistoryRepository extends JpaRepository<IrrigationHistory, Long> {
    List<IrrigationHistory> findBySectorId(Long sectorId);

    Optional<IrrigationHistory> findFirstBySectorIdAndEndDateTimeIsNullOrderByStartDateTimeDesc(Long sectorId);
}
