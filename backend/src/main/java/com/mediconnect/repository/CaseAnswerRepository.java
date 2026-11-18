package com.mediconnect.repository;

import com.mediconnect.entity.CaseAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseAnswerRepository extends JpaRepository<CaseAnswer, String> {
    List<CaseAnswer> findByPatientCaseId(String caseId);
    List<CaseAnswer> findByPatientCaseIdAndQuestionId(String caseId, String questionId);
}
