package com.legrandc.irrigation_system.dtos.sector;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class SectorRequestValidationTest {

    private final Validator validator;

    SectorRequestValidationTest() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        this.validator = factory.getValidator();
    }

    @Test
    void shouldAllowNullDefaultConfigurationForSectorUpdates() {
        SectorRequest request = new SectorRequest();
        request.setName("Sector principal");
        request.setDescription("Descripción");
        request.setCurrentState("ACTIVE");

        assertTrue(validator.validate(request).isEmpty());
    }
}
