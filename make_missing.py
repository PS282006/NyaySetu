import os

os.makedirs("data", exist_ok=True)

missing_laws = {
    "Maharashtra_Rent_Control_Act_1999.txt": """MAHARASHTRA RENT CONTROL ACT, 1999
Chapter 1: Preliminary
Section 18: Receipt for rent and security deposit. 
(1) Every landlord shall give a written receipt for any amount received as rent or security deposit. 
(2) A landlord cannot arbitrarily withhold a security deposit beyond 30 days of lease termination unless there are unpaid dues or severe damages to the property. 
(3) Failure to return the deposit gives the tenant the right to claim the full amount legally.""",

    "Minimum_Wages_Act_1948.txt": """MINIMUM WAGES ACT, 1948
Section 12: Payment of minimum rates of wages.
(1) Where in respect of any scheduled employment a notification under section 5 is in force, the employer shall pay to every employee engaged in a scheduled employment under him wages at a rate not less than the minimum rate of wages fixed by such notification for that class of employees in that employment without any deductions except as may be authorized."""
}

for filename, content in missing_laws.items():
    with open(f"data/{filename}", "w", encoding="utf-8") as f:
        f.write(content)

print("SUCCESS: The 2 missing laws are now sitting in your data folder as text files!")