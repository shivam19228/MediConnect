package com.mediconnect.repository;

import com.mediconnect.entity.DailyTokenSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DailyTokenSequenceRepository extends JpaRepository<DailyTokenSequence, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM DailyTokenSequence s WHERE s.dateKey = :dateKey")
    Optional<DailyTokenSequence> findByDateKeyForUpdate(String dateKey);
}
