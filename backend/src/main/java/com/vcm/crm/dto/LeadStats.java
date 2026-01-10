package com.vcm.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeadStats {
    private long total;  // total de leads en el rango
    private long open;   // abiertos / activos
    private long won;    // ganados / convertidos
    private long lost;   // perdidos / descartados
}
