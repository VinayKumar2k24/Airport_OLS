declare module '@deck.gl/google-maps' {
  export class GoogleMapsOverlay {
    constructor(props: any);
    setMap(map: any): void;
    setProps(props: any): void;
    finalize(): void;
  }
}

declare module '@deck.gl/layers' {
  export class GeoJsonLayer extends any {
    constructor(props: any);
  }
}
