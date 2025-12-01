---
config:
  layout: dagre
---
flowchart TB
 subgraph s1["CPC Increase Branch"]
        F["<b>Source: Daily stats report<br>(in red - Google Interface)</b><br><br>Check if the increase is coming from:<br>accounts/ segments/ quality/<br>page/ device/ campaigns<br>(including actual VS tCPA)/ match<br>type/ ad group/ keyword"]
        E["CPC Increase"]
        G@{ label: "<b>Source: Daily stats report</b><br><br>Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        H["Recommendation: Examine<br>and correct purchase mix if<br>needed"]
        I{"Is the decrease from a specific<br>source?"}
        J["Check clicks volume<br>(increase/decrease)"]
        L["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        K["Broad decrease diagnosis"]
        M{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        N{"Check - clicks<br>increased/ decreased/<br>remain the same"}
        O{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        P{"<b>Source: Google</b><br><br>Check seasonality"}
        Q["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        R["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        S["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        T["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
  end
 subgraph s2["CVR Decrease Branch"]
        V["Diagnose CVR Decrease<br>( CTL, CTS)"]
        U["CVR Decrease"]
        W["SCTR decrease"]
        X["Check if the increase is coming from:<br>accounts/ segments/ quality/<br>page/ device/ campaigns<br>(including actual VS tCPA)/ match<br>type/ ad group/ keyword"]
        Y{"<b>Source: Unicorn log</b><br><br>Check brand mix. Was<br>there a change in the lineup?"}
        Z@{ label: "Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        AA["Recommendation: Examine<br>and correct purchase mix if<br>needed"]
        AB{"Is the decrease from a specific<br>source?"}
        AC["Manually evaluate if the result<br>is distorted"]
        AD["End flow here, likely not the<br>cause"]
        AE["Check clicks volume<br>(increase/decrease)"]
        AF["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AG["Broad decrease diagnosis"]
        AH{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        AI{"Check - clicks<br>increased/ decreased/<br>remain the same"}
        AJ{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        AK{"<b>Source: Google</b><br><br>Check seasonality"}
        AL["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        AM["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AN["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        AO["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
        AP["Decrease in OCTL or OCTS"]
        AQ["Check if the increase is coming from:<br>accounts/ segments/ quality/<br>page/ device/ campaigns<br>(including actual VS tCPA)/ match<br>type/ ad group/ keyword"]
        AR@{ label: "Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        AS["Recommendation: Examine<br>and correct purchase mix if<br>needed"]
        AT{"Is the decrease from a specific<br>source?"}
        AU["Check clicks volume<br>(increase/decrease)"]
        AV["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AW["Broad decrease diagnosis"]
        AX{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        AY{"Check - clicks<br>increased/ decreased/<br>remain the same"}
        AZ{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        BA{"<b>Source: Google</b><br><br>Check seasonality"}
        BB["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        BC["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        BD["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        BE["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
        BF["Brands"]
        BG{"<b>Source: Unicorn log</b><br><br>Check brand mix: Was<br>there a change in the lineup?"}
        BH{"<b>Source: Dash tracks report</b><br><br>Check performance per<br>brand (OCTL/OCTS decrease)"}
        BI["Manually evaluate if the result<br>is desired"]
        BJ["End flow here, likely not the<br>cause"]
        BK["Recommendation: Investigate<br>specific cause of conversion<br>rate decrease"]
        BL["Recommendation: Recheck<br>traffic, likely originating from<br>there"]
  end
 subgraph s3["EPC Change Branch"]
        CA{"Is the change significant?"}
        C["EPC Change"]
        CB["End investigation"]
        CC["Investigate the cause"]
        CD{"Did EPL change?"}
        CG{"Did OCTL change?"}
        CE{"Was there a deal change?"}
        CF{"Was there a different lead attribution<br>between the brands?"}
        CQ["Further investigation is needed"]
        CH{"Is the issue with all brands<br>or a specific brand?"}
        CI["Check campaigns"]
        CJ{"Is the reporting similar to CMS?"}
        CK["Open a ticket to data to check the script"]
        CL{"Is the issue with all landing pages?"}
        CM["Tell the brand"]
        CN{"Is the issue with all devices?"}
        CO{"Is the issue with all publisher accounts?"}
        CP["Check campaigns"]
  end
  
    A["ROAS Decline"] --> B["CPA Increase"] & C & n1["Untitled Node"]
    B --> D{"CPC Increase or CVR Decrease?"}
    D -- CPC Increase --> E
    D -- CVR Decrease --> U
    E --> F
    F -- No --> G
    G --> H
    F -- Yes --> I
    I -- Yes --> J
    J --> L
    I -- No --> K
    K --> M & N & O & P
    M --> Q
    N --> R
    O --> S
    P --> T
    U -- Only if significant --> V
    V -- SCTR --> W
    W --> X & Y
    X -- No --> Z
    Z --> AA
    X -- Yes --> AB
    Y -- Yes --> AC
    Y -- No --> AD
    AB -- Yes --> AE
    AE --> AF
    AB -- No --> AG
    AG --> AH & AI & AJ & AK
    AH --> AL
    AI --> AM
    AJ --> AN
    AK --> AO
    V -- CTL / CTS --> AP
    AP --> AQ & BF
    AQ -- No --> AR
    AR --> AS
    AQ -- Yes --> AT
    AT -- Yes --> AU
    AU --> AV
    AT -- No --> AW
    AW --> AX & AY & AZ & BA
    AX --> BB
    AY --> BC
    AZ --> BD
    BA --> BE
    BF --> BG & BH
    BG -- Yes --> BI
    BG -- No --> BJ
    BH -- Specific Brand --> BK
    BH -- All Brands --> BL
    C --> CA
    CA -- No --> CB
    CA -- Yes --> CC
    CC --> CD
    CD -- No --> CG
    CD -- Yes --> CE
    CE -- Yes --> CB
    CE -- No --> CF
    CF -- Yes --> CB
    CF -- No --> CQ
    CG -- Yes --> CH
    CG -- No --> CQ
    CH -- All Brands --> CI
    CH -- Specific Brand --> CJ
    CJ -- No --> CK
    CJ -- Yes --> CL
    CL -- Specific Landing Page --> CM
    CL -- All Landing Pages --> CN
    CN -- Specific Device --> CM
    CN -- All Devices --> CO
    CO -- Yes --> CM
    CO -- No --> CP
    s2 --> s1 & n2["Untitled Node"]

    G@{ shape: rect}
    Z@{ shape: rect}
    AR@{ shape: rect}