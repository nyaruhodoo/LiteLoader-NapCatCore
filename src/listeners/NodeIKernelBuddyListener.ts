import { BuddyCategoryType, FriendRequestNotify, OnBuddyChangeParams } from '@/entities';
interface IBuddyListener {
  onBuddyListChange(arg: OnBuddyChangeParams): void,

  onBuddyInfoChange(arg: unknown): void,

  onBuddyDetailInfoChange(arg: unknown): void,

  onNickUpdated(arg: unknown): void,

  onBuddyRemarkUpdated(arg: unknown): void,

  onAvatarUrlUpdated(arg: unknown): void,

  onBuddyReqChange(arg: FriendRequestNotify): void,

  onBuddyReqUnreadCntChange(arg: unknown): void,

  onCheckBuddySettingResult(arg: unknown): void,

  onAddBuddyNeedVerify(arg: unknown): void,

  onSmartInfos(arg: unknown): void,

  onSpacePermissionInfos(arg: unknown): void,

  onDoubtBuddyReqChange(arg: unknown): void,

  onDoubtBuddyReqUnreadNumChange(arg: unknown): void,

  onBlockChanged(arg: unknown): void,

  onAddMeSettingChanged(arg: unknown): void,

  onDelBatchBuddyInfos(arg: unknown): void
}

export interface NodeIKernelBuddyListener extends IBuddyListener {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  new(listener: IBuddyListener): NodeIKernelBuddyListener;
}

export class BuddyListener implements IBuddyListener {
  onAddBuddyNeedVerify(arg: unknown) {
  }

  onAddMeSettingChanged(arg: unknown) {
  }

  onAvatarUrlUpdated(arg: unknown) {
  }

  onBlockChanged(arg: unknown) {
  }

  onBuddyDetailInfoChange(arg: unknown) {
  }

  onBuddyInfoChange(arg: unknown) {
  }

  onBuddyListChange(arg: OnBuddyChangeParams): void {
  }

  onBuddyRemarkUpdated(arg: unknown): void {
  }

  onBuddyReqChange(arg: FriendRequestNotify): void {
  }

  onBuddyReqUnreadCntChange(arg: unknown): void {
  }

  onCheckBuddySettingResult(arg: unknown): void {
  }

  onDelBatchBuddyInfos(arg: unknown): void {
  }

  onDoubtBuddyReqChange(arg: unknown): void {
  }

  onDoubtBuddyReqUnreadNumChange(arg: unknown): void {
  }

  onNickUpdated(arg: unknown): void {
  }

  onSmartInfos(arg: unknown): void {
  }

  onSpacePermissionInfos(arg: unknown): void {
  }
}
