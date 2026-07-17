package com.legrandc.irrigation_system.repository;

import com.legrandc.irrigation_system.models.IrrigationConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IrrigationConfigurationRepository extends JpaRepository<IrrigationConfiguration, Long> {
    List<IrrigationConfiguration> findBySectorId(Long sectorId);

    Optional<IrrigationConfiguration> findBySectorIdAndStartTime(Long sectorId, LocalTime startTime);

    List<IrrigationConfiguration> findBySectorIdAndEnabledTrue(Long sectorId);
}
