package com.mediconnect.service;

import com.mediconnect.entity.DailyTokenSequence;
import com.mediconnect.repository.DailyTokenSequenceRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Service
public class TokenGenerationService {

    private final DailyTokenSequenceRepository sequenceRepository;

    public TokenGenerationService(DailyTokenSequenceRepository sequenceRepository) {
        this.sequenceRepository = sequenceRepository;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public String generateNextTokenNumber(LocalDate submissionDate) {
        String dateKey = submissionDate.format(DateTimeFormatter.BASIC_ISO_DATE);

        DailyTokenSequence sequence;
        Optional<DailyTokenSequence> existing = sequenceRepository.findByDateKeyForUpdate(dateKey);
        if (existing.isPresent()) {
            sequence = existing.get();
        } else {
            try {
                DailyTokenSequence initial = new DailyTokenSequence(dateKey, 0);
                sequence = sequenceRepository.saveAndFlush(initial);
            } catch (DataIntegrityViolationException e) {
                sequence = sequenceRepository.findByDateKeyForUpdate(dateKey)
                        .orElseThrow(() -> new IllegalStateException("Failed to acquire daily token sequence lock"));
            }
        }

        int nextSeq = sequence.getLastSeq() + 1;
        sequence.setLastSeq(nextSeq);
        sequenceRepository.saveAndFlush(sequence);

        return String.format("MC-%s-%04d", dateKey, nextSeq);
    }
}
