package com.mediconnect.dto.response;

public class DoctorTriageStatsResponse {

    private long totalSubmitted;
    private long pendingReview;
    private long urgentCases;
    private long reviewedCases;
    private long requiresFollowup;

    public DoctorTriageStatsResponse() {
    }

    public DoctorTriageStatsResponse(long totalSubmitted, long pendingReview, long urgentCases, long reviewedCases, long requiresFollowup) {
        this.totalSubmitted = totalSubmitted;
        this.pendingReview = pendingReview;
        this.urgentCases = urgentCases;
        this.reviewedCases = reviewedCases;
        this.requiresFollowup = requiresFollowup;
    }

    public long getTotalSubmitted() {
        return totalSubmitted;
    }

    public void setTotalSubmitted(long totalSubmitted) {
        this.totalSubmitted = totalSubmitted;
    }

    public long getPendingReview() {
        return pendingReview;
    }

    public void setPendingReview(long pendingReview) {
        this.pendingReview = pendingReview;
    }

    public long getUrgentCases() {
        return urgentCases;
    }

    public void setUrgentCases(long urgentCases) {
        this.urgentCases = urgentCases;
    }

    public long getReviewedCases() {
        return reviewedCases;
    }

    public void setReviewedCases(long reviewedCases) {
        this.reviewedCases = reviewedCases;
    }

    public long getRequiresFollowup() {
        return requiresFollowup;
    }

    public void setRequiresFollowup(long requiresFollowup) {
        this.requiresFollowup = requiresFollowup;
    }
}
