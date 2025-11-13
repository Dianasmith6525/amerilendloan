/// <reference types="@types/google.maps" />

declare module "react-google-autocomplete" {
  import { ComponentType } from "react";

  export interface AutocompleteProps {
    apiKey?: string;
    onPlaceSelected?: (place: any, inputRef?: any, autocomplete?: any) => void;
    options?: {
      types?: string[];
      componentRestrictions?: { country?: string | string[] };
      fields?: string[];
    };
    className?: string;
    placeholder?: string;
    value?: string;
    onChange?: (e: any) => void;
    defaultValue?: string;
    inputAutocompleteValue?: string;
    [key: string]: any;
  }

  const Autocomplete: ComponentType<AutocompleteProps>;
  export default Autocomplete;
}
