package com.legrandc.irrigation_system.repository;

import com.legrandc.irrigation_system.models.Sector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SectorRepository extends JpaRepository<Sector, Long> {
    List<Sector> findByNameContainingIgnoreCase(String name);

    List<Sector> findByArchivedFalse();
}
