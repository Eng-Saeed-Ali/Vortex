declare module 'google-libphonenumber' {
  export class PhoneNumberUtil {
    static getInstance(): PhoneNumberUtil;
    parse(number: string, regionCode: string): PhoneNumber;
    format(number: PhoneNumber, format: PhoneNumberFormat): string;
    isValidNumber(number: PhoneNumber): boolean;
    getRegionCodeForNumber(number: PhoneNumber): string;
    getCountryCodeForRegion(regionCode: string): number | null;
  }

  export class PhoneNumber {
    getCountryCode(): number;
    getNationalNumber(): { toString(): string };
  }

  export enum PhoneNumberFormat {
    E164 = 0,
    INTERNATIONAL = 1,
    NATIONAL = 2,
    RFC3966 = 3,
  }

  export enum PhoneNumberType {
    FIXED_LINE = 0,
    MOBILE = 1,
    FIXED_LINE_OR_MOBILE = 2,
    TOLL_FREE = 3,
    PREMIUM_RATE = 4,
    SHARED_COST = 5,
    VOIP = 6,
    PERSONAL_NUMBER = 7,
    PAGER = 8,
    UAN = 9,
    VOICEMAIL = 10,
    UNKNOWN = -1,
  }
}