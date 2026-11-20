package com.speedshift.api;

import com.speedshift.api.dto.ListingDtos.CreateListingRequest;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ListingCategoryValidationTest {
    @Test
    void acceptsBuggysButRejectsUnknownCategories() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            assertTrue(validator.validateValue(CreateListingRequest.class, "category", "Buggys").isEmpty());
            assertFalse(validator.validateValue(CreateListingRequest.class, "category", "Inconnue").isEmpty());
        }
    }
}
