---
config:
  layout: dagre
---
flowchart TB
 subgraph s1["CPC Change Branch"]
        E["CPC Change"]
        G@{ label: "<b>Source: Daily stats report</b><br><br>Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        H["check mix and adjust if needed"]
        G_NO_1["go back to CPC investigation"]
        I{"Is the change from a specific<br>source?"}
        J@{ label: "Recommendation:<br style=\"--tw-scale-x:\">adjust prices if needed" }
        K["Broad change diagnosis"]
        M{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        O{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        P{"<b>Source: Google</b><br><br>Check seasonality"}
        Q["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        S["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        T["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
  end
 subgraph s2["CVR Change Branch"]
        W["SCTR change"]
        Y{"<b>Source: Unicorn log</b><br><br>Check brand mix. Was<br>there a change in the lineup?"}
        Z@{ label: "Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        AA["check mix and adjust if needed"]
        Z_NO_1["go back to CPC investigation"]
        AB{"Is the change from a specific<br>source?"}
        AC["Manually evaluate if the result<br>is distorted"]
        AD["End flow here, likely not the<br>cause"]
        AE["Check clicks volume<br>(change/change)"]
        AF["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AG["Broad change diagnosis"]
        AH{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        AJ{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        AK{"<b>Source: Google</b><br><br>Check seasonality"}
        AL["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        AN["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        AO["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
  end
 
    %% New EPC Change Branch (S3 Replacement)
    Start([EPC Change Detected]) --> Significant{"Is the change<br>significant?"}
    Significant -- No --> EndInv([End Investigation])
    Significant -- Yes --> PayModel{"Are most brands<br>paying for Leads or Sales?"}

    %% Subgraph for Financial Metrics
    subgraph RevenueMetrics ["Revenue Metric Investigation (Price)"]
        PayModel -- Leads --> CheckEPL{"Did EPL Change?"}
        PayModel -- Sales --> CheckEPS{"Did EPS Change?"}
        
        CheckEPL -- Yes --> DealChange{"Did a brand<br>change their deal?"}
        CheckEPS -- Yes --> DealChange

        DealChange -- Yes --> EndDeal([Cause: Deal Change])
        DealChange -- No --> LineupChange{"Did Lineups Change?"}
        
        LineupChange -- Yes --> EndLineup([Cause: Lineup Change<br>affected EPL/EPS])
        LineupChange -- No --> UnknownPrice([Investigate other<br>price factors])
    end

    %% Subgraph for Conversion Metrics
    subgraph ConversionMetrics ["Conversion Investigation (Volume/CR)"]
        CheckEPL -- No --> CRLead[Check Outclick to Lead Ratio]
        CheckEPS -- No --> CRSale[Check Outclick to Sale Ratio]
        
        CRLead --> Scope{"Where did the<br>CR change come from?"}
        CRSale --> Scope
    end

    %% Subgraph for Specific Brand Deep Dive
    subgraph SpecificBrand ["Specific Brand Investigation"]
        Scope -- Specific Brand --> Reporting{"Verify Reporting:<br>Is it accurate?"}
        
        Reporting -- No/Internal Issue --> TicketData[Open Ticket to Data Team<br>to fix scripts]
        Reporting -- Yes/Matches Brand --> DeepDive{"Isolate Source"}
        
        DeepDive --> CheckLP[Check Landing Pages]
        DeepDive --> CheckDev[Check Devices]
        
        CheckLP --> ShareBrand[Share findings<br>with Brand]
        CheckDev --> ShareBrand
    end

    %% Subgraph for System/Traffic Deep Dive
    subgraph AllBrands ["Global/System Investigation"]
        Scope -- All Brands --> ProdChange{"Was there a<br>Product/Site Change?"}
        
        ProdChange -- Yes --> AnalyzeEff([Analyze the effect<br>of the change])
        ProdChange -- No --> AccountCheck{"Is the change on<br>ALL Accounts?<br>(Google, MSN, FB)"}
        
        AccountCheck -- Yes --> External([Cause: External Factors<br>Not related to our actions])
        AccountCheck -- No --> CampScope{"Is it from ALL campaigns<br>in the changed account?"}
        
        CampScope -- Yes --> ContactPub[Reach out to Publisher]
        CampScope -- No --> InvestCamp[Investigate Specific Campaign]
    end
    
    %% Original Links (updated B and V links)
    A["ROAS Change"] --> B["Check at 09:00 -> CPOC Change"] & Start
    B --> D{"CPC Change or SCTR Change?"}
    D -- CPC Change --> E
    D -- CVR Change --> W
    E --> G & I
    G -- yes --> H
    G -- no --> G_NO_1
    I -- Yes --> J
    I -- No --> K
    K --> M & O & P
    M --> Q
    O --> S
    P --> T
    W --> Y & Z & AB
    Y -- Yes --> AC
    Y -- No --> AD
    Z -- yes --> AA
    Z -- no --> Z_NO_1
    AB -- Yes --> AE
    AE --> AF
    AB -- No --> AG
    AG --> AH & AJ & AK
    AH --> AL
    AJ --> AN
    AK --> AO
    s2 --> s1

    G@{ shape: rect}
    J@{ shape: rect}
    Z@{ shape: rect}
    style G_NO_1 stroke:#000000
    style Z_NO_1 stroke:#000000
    style s1 stroke:#000000
    
    %% New EPC Styling
    classDef decision fill:#f9f,stroke:#333,stroke-width:2px;
    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef endstate fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,rx:10;
    
    class Significant,PayModel,CheckEPL,CheckEPS,DealChange,LineupChange,Scope,Reporting,ProdChange,AccountCheck,CampScope,DeepDive decision;
    class Start,CRLead,CRSale,TicketData,CheckLP,CheckDev,ShareBrand,ContactPub,InvestCamp process;
    class EndInv,EndDeal,EndLineup,AnalyzeEff,External,UnknownPrice endstate;