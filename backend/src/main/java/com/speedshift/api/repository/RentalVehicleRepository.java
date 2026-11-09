package com.speedshift.api.repository;

import com.speedshift.api.entity.RentalVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;

public interface RentalVehicleRepository extends JpaRepository<RentalVehicle, Long>, JpaSpecificationExecutor<RentalVehicle> {
    @Override
    @EntityGraph(attributePaths = {"agency", "agency.owner"})
    List<RentalVehicle> findAll();

    List<RentalVehicle> findByAgencyOwnerIdOrderByCreatedAtDesc(Long ownerId);
    long countByAgencyOwnerId(Long ownerId);
}
