package com.vcm.crm.util;

import javax.persistence.AttributeConverter;
import javax.persistence.Converter;

/**
 * Mapea:
 *  - Boolean TRUE  -> 0  (ACTIVO)
 *  - Boolean FALSE -> 1  (INACTIVO)
 */
@Converter(autoApply = false)
public class ActiveZeroOneConverter implements AttributeConverter<Boolean, Integer> {

    @Override
    public Integer convertToDatabaseColumn(Boolean value) {
        if (value == null) {
            return 0; // por defecto, activo
        }
        // true = activo => 0
        // false = inactivo => 1
        return value ? 0 : 1;
    }

    @Override
    public Boolean convertToEntityAttribute(Integer dbValue) {
        if (dbValue == null) {
            return true; // por defecto, activo
        }
        // 0 = activo => true
        // 1 = inactivo => false
        return dbValue == 0;
    }
}
