import {
  NativeTabs,
  Icon,
  Label,
} from "expo-router/unstable-native-tabs";


import { Primary } from "@/constants/design-tokens";

export default function AppLayout() {
  return (
    <NativeTabs 
      minimizeBehavior="onScrollDown"
      tintColor={Primary[500]}
    >
      <NativeTabs.Trigger name="(feed)">
        <Label>Feed</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(milestones)">
        <Label>Milestones</Label>
        <Icon sf="star.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(growth)">
        <Label>Growth</Label>
        <Icon sf="chart.line.uptrend.xyaxis" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(capsule)">
        <Label>Capsule</Label>
        <Icon sf="envelope.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(settings)">
        <Label>Settings</Label>
        <Icon sf="gearshape.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
