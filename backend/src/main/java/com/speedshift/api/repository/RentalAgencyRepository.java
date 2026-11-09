package com.speedshift.api.repository;

import com.speedshift.api.entity.RentalAgency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;

public interface RentalAgencyRepository extends JpaRepository<RentalAgency, Long> {
    Optional<RentalAgency> findByOwnerId(Long ownerId);

    @Override
    @EntityGraph(attributePaths = "owner")
    List<RentalAgency> findAll();
}
