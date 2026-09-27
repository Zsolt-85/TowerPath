/**
 * NRBF binary decoder for Unity playerInfo.dat saves.
 *
 * Adapted from TowerSmith (https://github.com/AngryBrit/tower-smith,
 * src/playerSave/nrbf.ts, license CC BY-NC-SA 4.0) which itself adapts the
 * open-source NRBF parser by CrispStrobe/nrbf.
 *
 * Decode-only port: the encoder (BinaryWriter / NrbfEncoder) from the
 * original is intentionally omitted — TowerPath only needs to read saves.
 * Decode logic is unchanged apart from TypeScript strict-safety adaptations
 * (no `any`, no private-bracket access).
 *
 * Client-safe: no node: imports, no fs. Runs in the browser.
 */

export enum RecordType {
  SerializedStreamHeader = 0,
  ClassWithId = 1,
  SystemClassWithMembers = 2,
  ClassWithMembers = 3,
  SystemClassWithMembersAndTypes = 4,
  ClassWithMembersAndTypes = 5,
  BinaryObjectString = 6,
  BinaryArray = 7,
  MemberPrimitiveTyped = 8,
  MemberReference = 9,
  ObjectNull = 10,
  MessageEnd = 11,
  BinaryLibrary = 12,
  ObjectNullMultiple256 = 13,
  ObjectNullMultiple = 14,
  ArraySinglePrimitive = 15,
  ArraySingleObject = 16,
  ArraySingleString = 17,
}

export enum BinaryType {
  Primitive = 0,
  String = 1,
  Object = 2,
  SystemClass = 3,
  Class = 4,
  ObjectArray = 5,
  StringArray = 6,
  PrimitiveArray = 7,
}

export enum PrimitiveType {
  Boolean = 1,
  Byte = 2,
  Char = 3,
  Decimal = 5,
  Double = 6,
  Int16 = 7,
  Int32 = 8,
  Int64 = 9,
  SByte = 10,
  Single = 11,
  TimeSpan = 12,
  DateTime = 13,
  UInt16 = 14,
  UInt32 = 15,
  UInt64 = 16,
  Null = 17,
  String = 18,
}

export enum BinaryArrayType {
  Single = 0,
  Jagged = 1,
  Rectangular = 2,
  SingleOffset = 3,
  JaggedOffset = 4,
  RectangularOffset = 5,
}

export abstract class NrbfRecord {
  abstract get recordType(): RecordType;
  abstract get objectId(): number | null;
}

export class SerializationHeader extends NrbfRecord {
  constructor(
    public rootId: number,
    public headerId: number,
    public majorVersion: number,
    public minorVersion: number,
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.SerializedStreamHeader;
  }
  get objectId(): number | null {
    return null;
  }
}

export class BinaryLibrary extends NrbfRecord {
  constructor(
    public libraryId: number,
    public libraryName: string,
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.BinaryLibrary;
  }
  get objectId(): number | null {
    return this.libraryId;
  }
}

export interface ClassInfo {
  objectId: number;
  name: string;
  memberCount: number;
  memberNames: string[];
}

export type AdditionalTypeInfo =
  | { type: "Primitive"; primitiveType: PrimitiveType }
  | { type: "SystemClass"; className: string }
  | { type: "Class"; className: string; libraryId: number }
  | { type: "None" };

export interface ClassTypeInfo {
  typeName: string;
  libraryId: number;
}

export interface MemberTypeInfo {
  binaryTypeEnums: BinaryType[];
  additionalInfos: AdditionalTypeInfo[];
}

export type PrimitiveValue = boolean | number | string | bigint | null;

export type ObjectValue = PrimitiveValue | NrbfRecord;

export class ClassRecord extends NrbfRecord {
  public memberValues: Map<string, ObjectValue> = new Map();
  public metadataId?: number;

  constructor(
    public classInfo: ClassInfo,
    public memberTypeInfo: MemberTypeInfo | null,
    public libraryId: number | null,
    public recordTypeValue: RecordType,
    metadataId?: number,
  ) {
    super();
    this.metadataId = metadataId;
  }

  get recordType(): RecordType {
    return this.recordTypeValue;
  }
  get objectId(): number | null {
    return this.classInfo.objectId;
  }
  get typeName(): string {
    return this.classInfo.name;
  }
  get memberNames(): string[] {
    return this.classInfo.memberNames;
  }

  getValue(memberName: string): ObjectValue | undefined {
    return this.memberValues.get(memberName);
  }
}

export class BinaryArrayRecord extends NrbfRecord {
  constructor(
    public arrayObjectId: number,
    public binaryArrayTypeEnum: BinaryArrayType,
    public rank: number,
    public lengths: number[],
    public lowerBounds: number[] | null,
    public typeEnum: BinaryType,
    public additionalTypeInfo: AdditionalTypeInfo,
    public elementValues: ObjectValue[],
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.BinaryArray;
  }
  get objectId(): number | null {
    return this.arrayObjectId;
  }

  getArray(): ObjectValue[] {
    return this.elementValues;
  }

  getTotalLength(): number {
    return this.lengths.reduce((a, b) => a * b, 1);
  }
}

export class ArraySinglePrimitiveRecord extends NrbfRecord {
  constructor(
    public arrayObjectId: number,
    public length: number,
    public primitiveTypeEnum: PrimitiveType,
    public elementValues: PrimitiveValue[],
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.ArraySinglePrimitive;
  }
  get objectId(): number | null {
    return this.arrayObjectId;
  }

  getArray(): PrimitiveValue[] {
    return this.elementValues;
  }
}

export class ArraySingleObjectRecord extends NrbfRecord {
  constructor(
    public arrayObjectId: number,
    public length: number,
    public elementValues: ObjectValue[],
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.ArraySingleObject;
  }
  get objectId(): number | null {
    return this.arrayObjectId;
  }

  getArray(): ObjectValue[] {
    return this.elementValues;
  }
}

export class ArraySingleStringRecord extends NrbfRecord {
  constructor(
    public arrayObjectId: number,
    public length: number,
    public elementValues: ObjectValue[],
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.ArraySingleString;
  }
  get objectId(): number | null {
    return this.arrayObjectId;
  }

  getArray(): ObjectValue[] {
    return this.elementValues;
  }
}

export class BinaryObjectStringRecord extends NrbfRecord {
  constructor(
    public stringObjectId: number,
    public value: string,
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.BinaryObjectString;
  }
  get objectId(): number | null {
    return this.stringObjectId;
  }
}

export class MemberPrimitiveTypedRecord extends NrbfRecord {
  constructor(
    public primitiveTypeEnum: PrimitiveType,
    public value: PrimitiveValue,
  ) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.MemberPrimitiveTyped;
  }
  get objectId(): number | null {
    return null;
  }
}

export class MemberReferenceRecord extends NrbfRecord {
  constructor(public idRef: number) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.MemberReference;
  }
  get objectId(): number | null {
    return null;
  }
}

export class ObjectNullRecord extends NrbfRecord {
  static instance = new ObjectNullRecord();

  get recordType(): RecordType {
    return RecordType.ObjectNull;
  }
  get objectId(): number | null {
    return null;
  }
}

export class ObjectNullMultipleRecord extends NrbfRecord {
  constructor(public nullCount: number) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.ObjectNullMultiple;
  }
  get objectId(): number | null {
    return null;
  }
}

export class ObjectNullMultiple256Record extends NrbfRecord {
  constructor(public nullCount: number) {
    super();
  }

  get recordType(): RecordType {
    return RecordType.ObjectNullMultiple256;
  }
  get objectId(): number | null {
    return null;
  }
}

export class MessageEndRecord extends NrbfRecord {
  static instance = new MessageEndRecord();

  get recordType(): RecordType {
    return RecordType.MessageEnd;
  }
  get objectId(): number | null {
    return null;
  }
}

class BinaryReader {
  private view: DataView;
  private offset = 0;
  private decoder = new TextDecoder("utf-8");

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
  }

  get byteLength(): number {
    return this.view.byteLength;
  }

  readByte(): number {
    return this.view.getUint8(this.offset++);
  }

  readSByte(): number {
    return this.view.getInt8(this.offset++);
  }

  readInt16(): number {
    const value = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return value;
  }

  readUInt16(): number {
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  readInt32(): number {
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readUInt32(): number {
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readInt64(): bigint {
    const value = this.view.getBigInt64(this.offset, true);
    this.offset += 8;
    return value;
  }

  readUInt64(): bigint {
    const value = this.view.getBigUint64(this.offset, true);
    this.offset += 8;
    return value;
  }

  readSingle(): number {
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readDouble(): number {
    const value = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return value;
  }

  readBoolean(): boolean {
    return this.readByte() !== 0;
  }

  readChar(): string {
    return String.fromCharCode(this.readByte());
  }

  readDecimal(): string {
    const bytes = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      bytes[i] = this.readByte();
    }
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  readDateTime(): bigint {
    return this.readUInt64();
  }

  readTimeSpan(): bigint {
    return this.readInt64();
  }

  readVariableLengthInt(): number {
    let value = 0;
    let shift = 0;

    while (shift < 35) {
      const b = this.readByte();
      value |= (b & 0x7f) << shift;

      if ((b & 0x80) === 0) {
        return value;
      }

      shift += 7;
    }

    throw new Error("Variable length int too long");
  }

  readLengthPrefixedString(): string {
    const length = this.readVariableLengthInt();

    if (length === 0) {
      return "";
    }

    if (length < 0) {
      throw new Error("Invalid string length");
    }

    const bytes = new Uint8Array(this.view.buffer, this.offset, length);
    this.offset += length;

    return this.decoder.decode(bytes);
  }

  getPosition(): number {
    return this.offset;
  }

  hasMore(): boolean {
    return this.offset < this.view.byteLength;
  }
}

type MetadataEntry = {
  classInfo: ClassInfo;
  memberTypeInfo: MemberTypeInfo | null;
  libraryId: number | null;
};

/**
 * NRBF Decoder — constructor takes an ArrayBuffer, decode() returns the root record.
 */
export class NrbfDecoder {
  private reader: BinaryReader;
  private recordMap = new Map<number, NrbfRecord>();
  private libraryMap = new Map<number, string>();
  private metadataMap = new Map<number, MetadataEntry>();
  private verbose = false;

  constructor(buffer: ArrayBuffer, verbose = false) {
    this.reader = new BinaryReader(buffer);
    this.verbose = verbose;
  }

  private log(message: string): void {
    if (this.verbose) {
      console.error(`[NRBF] ${message}`);
    }
  }

  decode(): NrbfRecord {
    this.log(`Starting decode, buffer size: ${this.reader.byteLength} bytes`);
    this.log(`Position: 0x${this.reader.getPosition().toString(16)}`);

    const headerByte = this.reader.readByte();
    this.log(
      `Header byte: 0x${headerByte.toString(16)} (expected 0x00 for SerializationHeader)`,
    );

    if (headerByte !== RecordType.SerializedStreamHeader) {
      throw new Error(
        `Invalid header: expected 0x00, got 0x${headerByte.toString(16)}`,
      );
    }

    const rootId = this.reader.readInt32();
    const headerId = this.reader.readInt32();
    const majorVersion = this.reader.readInt32();
    const minorVersion = this.reader.readInt32();

    this.log(
      `Header: rootId=${rootId}, headerId=${headerId}, version=${majorVersion}.${minorVersion}`,
    );
    this.log(`Position after header: 0x${this.reader.getPosition().toString(16)}`);

    const header = new SerializationHeader(rootId, headerId, majorVersion, minorVersion);

    let record: NrbfRecord;
    let count = 0;
    do {
      const pos = this.reader.getPosition();
      this.log(`\nRecord #${count} at offset 0x${pos.toString(16)}`);
      record = this.decodeNext();
      this.log(
        `  -> ${record.constructor.name}${record.objectId ? ` (ID: ${record.objectId})` : ""}`,
      );
      count++;

      if (count > 100000) {
        throw new Error("Too many records - possible infinite loop");
      }
    } while (!(record instanceof MessageEndRecord));

    this.log(`\nTotal records decoded: ${count}`);
    this.log(`Root ID from header: ${header.rootId}`);
    this.log(
      `Available record IDs: ${Array.from(this.recordMap.keys())
        .sort((a, b) => a - b)
        .join(", ")}`,
    );

    const root = this.recordMap.get(header.rootId);
    if (!root) {
      throw new Error(`Root object with ID ${header.rootId} not found`);
    }

    return root;
  }

  private decodeNext(): NrbfRecord {
    const pos = this.reader.getPosition();
    const recordTypeByte = this.reader.readByte();

    this.log(
      `  Offset 0x${pos.toString(16)}: RecordType byte = 0x${recordTypeByte.toString(16)}`,
    );

    switch (recordTypeByte) {
      case RecordType.SerializedStreamHeader:
        this.log(`    -> SerializedStreamHeader`);
        return this.decodeSerializationHeader();

      case RecordType.BinaryLibrary:
        this.log(`    -> BinaryLibrary`);
        return this.decodeBinaryLibrary();

      case RecordType.ClassWithMembersAndTypes:
        this.log(`    -> ClassWithMembersAndTypes`);
        return this.decodeClassWithMembersAndTypes();

      case RecordType.SystemClassWithMembersAndTypes:
        this.log(`    -> SystemClassWithMembersAndTypes`);
        return this.decodeSystemClassWithMembersAndTypes();

      case RecordType.SystemClassWithMembers:
        this.log(`    -> SystemClassWithMembers`);
        return this.decodeSystemClassWithMembers();

      case RecordType.ClassWithMembers:
        this.log(`    -> ClassWithMembers`);
        return this.decodeClassWithMembers();

      case RecordType.ClassWithId:
        this.log(`    -> ClassWithId`);
        return this.decodeClassWithId();

      case RecordType.BinaryObjectString:
        this.log(`    -> BinaryObjectString`);
        return this.decodeBinaryObjectString();

      case RecordType.BinaryArray:
        this.log(`    -> BinaryArray`);
        return this.decodeBinaryArray();

      case RecordType.ArraySinglePrimitive:
        this.log(`    -> ArraySinglePrimitive`);
        return this.decodeArraySinglePrimitive();

      case RecordType.ArraySingleObject:
        this.log(`    -> ArraySingleObject`);
        return this.decodeArraySingleObject();

      case RecordType.ArraySingleString:
        this.log(`    -> ArraySingleString`);
        return this.decodeArraySingleString();

      case RecordType.MemberPrimitiveTyped:
        this.log(`    -> MemberPrimitiveTyped`);
        return this.decodeMemberPrimitiveTyped();

      case RecordType.MemberReference:
        this.log(`    -> MemberReference`);
        return this.decodeMemberReference();

      case RecordType.ObjectNull:
        this.log(`    -> ObjectNull`);
        return ObjectNullRecord.instance;

      case RecordType.ObjectNullMultiple:
        this.log(`    -> ObjectNullMultiple`);
        return this.decodeObjectNullMultiple();

      case RecordType.ObjectNullMultiple256:
        this.log(`    -> ObjectNullMultiple256`);
        return this.decodeObjectNullMultiple256();

      case RecordType.MessageEnd:
        this.log(`    -> MessageEnd`);
        return MessageEndRecord.instance;

      default:
        throw new Error(
          `Unsupported record type: ${recordTypeByte} (0x${recordTypeByte.toString(16)}) at offset 0x${pos.toString(16)}`,
        );
    }
  }

  private decodeSerializationHeader(): SerializationHeader {
    const rootId = this.reader.readInt32();
    const headerId = this.reader.readInt32();
    const majorVersion = this.reader.readInt32();
    const minorVersion = this.reader.readInt32();

    this.log(
      `      rootId=${rootId}, headerId=${headerId}, version=${majorVersion}.${minorVersion}`,
    );

    return new SerializationHeader(rootId, headerId, majorVersion, minorVersion);
  }

  private decodeBinaryLibrary(): BinaryLibrary {
    const libraryId = this.reader.readInt32();
    const libraryName = this.reader.readLengthPrefixedString();

    this.log(`      libraryId=${libraryId}, libraryName="${libraryName}"`);

    const record = new BinaryLibrary(libraryId, libraryName);
    this.libraryMap.set(libraryId, libraryName);

    return record;
  }

  private readClassInfo(): ClassInfo {
    const objectId = this.reader.readInt32();
    const name = this.reader.readLengthPrefixedString();
    const memberCount = this.reader.readInt32();
    const memberNames: string[] = [];

    for (let i = 0; i < memberCount; i++) {
      memberNames.push(this.reader.readLengthPrefixedString());
    }

    return { objectId, name, memberCount, memberNames };
  }

  private readMemberTypeInfo(memberCount: number): MemberTypeInfo {
    const binaryTypeEnums: BinaryType[] = [];

    for (let i = 0; i < memberCount; i++) {
      binaryTypeEnums.push(this.reader.readByte() as BinaryType);
    }

    const additionalInfos: AdditionalTypeInfo[] = [];

    for (let i = 0; i < memberCount; i++) {
      const binaryType = binaryTypeEnums[i] as BinaryType;

      switch (binaryType) {
        case BinaryType.Primitive:
          additionalInfos.push({
            type: "Primitive",
            primitiveType: this.reader.readByte() as PrimitiveType,
          });
          break;

        case BinaryType.SystemClass:
          additionalInfos.push({
            type: "SystemClass",
            className: this.reader.readLengthPrefixedString(),
          });
          break;

        case BinaryType.Class:
          additionalInfos.push({
            type: "Class",
            className: this.reader.readLengthPrefixedString(),
            libraryId: this.reader.readInt32(),
          });
          break;

        case BinaryType.PrimitiveArray:
          additionalInfos.push({
            type: "Primitive",
            primitiveType: this.reader.readByte() as PrimitiveType,
          });
          break;

        case BinaryType.String:
        case BinaryType.Object:
        case BinaryType.StringArray:
        case BinaryType.ObjectArray:
          additionalInfos.push({ type: "None" });
          break;

        default:
          additionalInfos.push({ type: "None" });
      }
    }

    return { binaryTypeEnums, additionalInfos };
  }

  private decodeClassWithMembersAndTypes(): ClassRecord {
    const classInfo = this.readClassInfo();
    const memberTypeInfo = this.readMemberTypeInfo(classInfo.memberCount);
    const libraryId = this.reader.readInt32();

    const record = new ClassRecord(
      classInfo,
      memberTypeInfo,
      libraryId,
      RecordType.ClassWithMembersAndTypes,
    );

    this.metadataMap.set(classInfo.objectId, { classInfo, memberTypeInfo, libraryId });
    this.recordMap.set(classInfo.objectId, record);

    this.readMemberValues(record, classInfo.memberNames, memberTypeInfo);

    return record;
  }

  private decodeSystemClassWithMembersAndTypes(): ClassRecord {
    const classInfo = this.readClassInfo();
    const memberTypeInfo = this.readMemberTypeInfo(classInfo.memberCount);

    const record = new ClassRecord(
      classInfo,
      memberTypeInfo,
      null,
      RecordType.SystemClassWithMembersAndTypes,
    );

    this.metadataMap.set(classInfo.objectId, { classInfo, memberTypeInfo, libraryId: null });
    this.recordMap.set(classInfo.objectId, record);

    this.readMemberValues(record, classInfo.memberNames, memberTypeInfo);

    return record;
  }

  private decodeSystemClassWithMembers(): ClassRecord {
    const classInfo = this.readClassInfo();

    const record = new ClassRecord(
      classInfo,
      null,
      null,
      RecordType.SystemClassWithMembers,
    );

    this.metadataMap.set(classInfo.objectId, {
      classInfo,
      memberTypeInfo: null,
      libraryId: null,
    });
    this.recordMap.set(classInfo.objectId, record);

    for (const memberName of classInfo.memberNames) {
      const value = this.decodeNext();
      record.memberValues.set(memberName, value);
    }

    return record;
  }

  private decodeClassWithMembers(): ClassRecord {
    const classInfo = this.readClassInfo();
    const libraryId = this.reader.readInt32();

    const record = new ClassRecord(
      classInfo,
      null,
      libraryId,
      RecordType.ClassWithMembers,
    );

    this.metadataMap.set(classInfo.objectId, {
      classInfo,
      memberTypeInfo: null,
      libraryId,
    });
    this.recordMap.set(classInfo.objectId, record);

    for (const memberName of classInfo.memberNames) {
      const value = this.decodeNext();
      record.memberValues.set(memberName, value);
    }

    return record;
  }

  private decodeClassWithId(): ClassRecord {
    const objectId = this.reader.readInt32();
    const metadataId = this.reader.readInt32();

    this.log(`      objectId=${objectId}, metadataId=${metadataId}`);

    const metadata = this.metadataMap.get(metadataId);
    if (!metadata) {
      throw new Error(`Metadata not found for ID ${metadataId}`);
    }

    const classInfo: ClassInfo = {
      objectId,
      name: metadata.classInfo.name,
      memberCount: metadata.classInfo.memberCount,
      memberNames: metadata.classInfo.memberNames,
    };

    const record = new ClassRecord(
      classInfo,
      metadata.memberTypeInfo,
      metadata.libraryId,
      RecordType.ClassWithId,
      metadataId,
    );

    this.recordMap.set(objectId, record);

    if (metadata.memberTypeInfo) {
      this.readMemberValues(record, classInfo.memberNames, metadata.memberTypeInfo);
    } else {
      for (const memberName of classInfo.memberNames) {
        const value = this.decodeNext();
        record.memberValues.set(memberName, value);
      }
    }

    return record;
  }

  private readMemberValues(
    record: ClassRecord,
    memberNames: string[],
    memberTypeInfo: MemberTypeInfo,
  ): void {
    for (let i = 0; i < memberNames.length; i++) {
      const memberName = memberNames[i] as string;
      const binaryType = memberTypeInfo.binaryTypeEnums[i] as BinaryType;
      const additionalInfo = memberTypeInfo.additionalInfos[i] as AdditionalTypeInfo;

      const value = this.readObjectValue(binaryType, additionalInfo);
      record.memberValues.set(memberName, value);
    }
  }

  private readObjectValue(
    binaryType: BinaryType,
    additionalInfo: AdditionalTypeInfo,
  ): ObjectValue {
    if (binaryType === BinaryType.Primitive && additionalInfo.type === "Primitive") {
      return this.readPrimitiveValue(additionalInfo.primitiveType);
    }
    return this.decodeNext();
  }

  private readPrimitiveValue(primitiveType: PrimitiveType): PrimitiveValue {
    switch (primitiveType) {
      case PrimitiveType.Boolean:
        return this.reader.readBoolean();

      case PrimitiveType.Byte:
        return this.reader.readByte();

      case PrimitiveType.SByte:
        return this.reader.readSByte();

      case PrimitiveType.Char:
        return this.reader.readChar();

      case PrimitiveType.Int16:
        return this.reader.readInt16();

      case PrimitiveType.UInt16:
        return this.reader.readUInt16();

      case PrimitiveType.Int32:
        return this.reader.readInt32();

      case PrimitiveType.UInt32:
        return this.reader.readUInt32();

      case PrimitiveType.Int64:
        return Number(this.reader.readInt64());

      case PrimitiveType.UInt64:
        return Number(this.reader.readUInt64());

      case PrimitiveType.Single:
        return this.reader.readSingle();

      case PrimitiveType.Double:
        return this.reader.readDouble();

      case PrimitiveType.Decimal:
        return this.reader.readDecimal();

      case PrimitiveType.DateTime:
        return Number(this.reader.readDateTime());

      case PrimitiveType.TimeSpan:
        return Number(this.reader.readTimeSpan());

      case PrimitiveType.String:
        return this.reader.readLengthPrefixedString();

      case PrimitiveType.Null:
        return null;

      default:
        throw new Error(`Unsupported primitive type: ${primitiveType as number}`);
    }
  }

  private decodeBinaryObjectString(): BinaryObjectStringRecord {
    const objectId = this.reader.readInt32();
    const value = this.reader.readLengthPrefixedString();

    const record = new BinaryObjectStringRecord(objectId, value);
    this.recordMap.set(objectId, record);

    return record;
  }

  private decodeBinaryArray(): BinaryArrayRecord {
    const objectId = this.reader.readInt32();
    const binaryArrayTypeEnum = this.reader.readByte() as BinaryArrayType;
    const rank = this.reader.readInt32();

    const lengths: number[] = [];
    for (let i = 0; i < rank; i++) {
      lengths.push(this.reader.readInt32());
    }

    let lowerBounds: number[] | null = null;
    if (
      binaryArrayTypeEnum === BinaryArrayType.SingleOffset ||
      binaryArrayTypeEnum === BinaryArrayType.JaggedOffset ||
      binaryArrayTypeEnum === BinaryArrayType.RectangularOffset
    ) {
      lowerBounds = [];
      for (let i = 0; i < rank; i++) {
        lowerBounds.push(this.reader.readInt32());
      }
    }

    const typeEnum = this.reader.readByte() as BinaryType;
    const additionalTypeInfo = this.readAdditionalTypeInfo(typeEnum);

    const totalElements = lengths.reduce((a, b) => a * b, 1);
    const elementValues = this.readAllElements(totalElements, typeEnum, additionalTypeInfo);

    const record = new BinaryArrayRecord(
      objectId,
      binaryArrayTypeEnum,
      rank,
      lengths,
      lowerBounds,
      typeEnum,
      additionalTypeInfo,
      elementValues,
    );

    this.recordMap.set(objectId, record);
    return record;
  }

  private readAdditionalTypeInfo(binaryType: BinaryType): AdditionalTypeInfo {
    switch (binaryType) {
      case BinaryType.Primitive:
        return {
          type: "Primitive",
          primitiveType: this.reader.readByte() as PrimitiveType,
        };

      case BinaryType.SystemClass:
        return {
          type: "SystemClass",
          className: this.reader.readLengthPrefixedString(),
        };

      case BinaryType.Class:
        return {
          type: "Class",
          className: this.reader.readLengthPrefixedString(),
          libraryId: this.reader.readInt32(),
        };

      default:
        return { type: "None" };
    }
  }

  private readAllElements(
    count: number,
    binaryType: BinaryType,
    additionalInfo: AdditionalTypeInfo,
  ): ObjectValue[] {
    const elements: ObjectValue[] = [];
    let i = 0;

    while (i < count) {
      const val = this.readObjectValue(binaryType, additionalInfo);

      if (val instanceof ObjectNullMultipleRecord) {
        for (let j = 0; j < val.nullCount; j++) {
          elements.push(null);
        }
        i += val.nullCount;
        continue;
      } else if (val instanceof ObjectNullMultiple256Record) {
        for (let j = 0; j < val.nullCount; j++) {
          elements.push(null);
        }
        i += val.nullCount;
        continue;
      } else if (val instanceof ObjectNullRecord) {
        elements.push(null);
      } else {
        elements.push(val);
      }

      i++;
    }

    return elements;
  }

  private decodeArraySinglePrimitive(): ArraySinglePrimitiveRecord {
    const objectId = this.reader.readInt32();
    const length = this.reader.readInt32();
    const primitiveTypeEnum = this.reader.readByte() as PrimitiveType;

    const elements: PrimitiveValue[] = [];
    for (let i = 0; i < length; i++) {
      elements.push(this.readPrimitiveValue(primitiveTypeEnum));
    }

    const record = new ArraySinglePrimitiveRecord(
      objectId,
      length,
      primitiveTypeEnum,
      elements,
    );
    this.recordMap.set(objectId, record);
    return record;
  }

  private decodeArraySingleObject(): ArraySingleObjectRecord {
    const objectId = this.reader.readInt32();
    const length = this.reader.readInt32();

    const elements = this.readAllElements(length, BinaryType.Object, { type: "None" });

    const record = new ArraySingleObjectRecord(objectId, length, elements);
    this.recordMap.set(objectId, record);
    return record;
  }

  private decodeArraySingleString(): ArraySingleStringRecord {
    const objectId = this.reader.readInt32();
    const length = this.reader.readInt32();

    const elements = this.readAllElements(length, BinaryType.String, { type: "None" });

    const record = new ArraySingleStringRecord(objectId, length, elements);
    this.recordMap.set(objectId, record);
    return record;
  }

  private decodeMemberPrimitiveTyped(): MemberPrimitiveTypedRecord {
    const primitiveTypeEnum = this.reader.readByte() as PrimitiveType;
    const value = this.readPrimitiveValue(primitiveTypeEnum);

    return new MemberPrimitiveTypedRecord(primitiveTypeEnum, value);
  }

  private decodeMemberReference(): MemberReferenceRecord {
    const idRef = this.reader.readInt32();

    this.log(`      idRef=${idRef}`);

    return new MemberReferenceRecord(idRef);
  }

  resolveReference(ref: MemberReferenceRecord): NrbfRecord {
    const record = this.recordMap.get(ref.idRef);
    if (!record) {
      throw new Error(`Cannot resolve reference to ID ${ref.idRef}`);
    }
    return record;
  }

  private decodeObjectNullMultiple(): ObjectNullMultipleRecord {
    const nullCount = this.reader.readInt32();
    this.log(`      nullCount=${nullCount}`);
    return new ObjectNullMultipleRecord(nullCount);
  }

  private decodeObjectNullMultiple256(): ObjectNullMultiple256Record {
    const nullCount = this.reader.readByte();
    this.log(`      nullCount=${nullCount}`);
    return new ObjectNullMultiple256Record(nullCount);
  }

  getRecord(objectId: number): NrbfRecord | undefined {
    return this.recordMap.get(objectId);
  }

  getAllRecords(): Map<number, NrbfRecord> {
    return this.recordMap;
  }

  getLibraries(): Map<number, string> {
    return this.libraryMap;
  }
}

/**
 * NRBF payload utilities.
 */
export class NrbfUtils {
  static startsWithPayloadHeader(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 17) {
      return false;
    }

    const view = new DataView(buffer);

    if (view.getUint8(0) !== RecordType.SerializedStreamHeader) {
      return false;
    }

    const expectedSuffix = [1, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 8; i++) {
      if (view.getUint8(9 + i) !== expectedSuffix[i]) {
        return false;
      }
    }

    return true;
  }
}
